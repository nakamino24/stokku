import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { InventoryPostingService, withInventoryTransaction } from '../inventory/inventory-posting.service';
import { DocumentSequenceService } from '../inventory/document-sequence.service';

export type ReconciliationRunStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DiscrepancyResolution = 'ADJUST_STORED' | 'ADJUST_LEDGER' | 'INVESTIGATE' | 'IGNORE';

interface ReconciliationRunRecord {
  id: string;
  status: ReconciliationRunStatus;
  warehouseId: string | null;
  warehouse?: { name: string; code: string } | null;
  startedById: string;
  completedById: string | null;
  startedAt: Date;
  completedAt: Date | null;
  totalBalances: number;
  discrepancyCount: number;
  resolvedCount: number;
  note: string | null;
}

interface DiscrepancyRecord {
  id: string;
  runId: string;
  balanceId: string;
  product: { name: string; sku: string };
  variant?: { name: string; sku: string } | null;
  warehouse: { name: string; code: string };
  bin?: { code: string } | null;
  storedOnHand: string;
  storedAllocated: string;
  storedHold: string;
  storedAvailable: string;
  ledgerOnHand: string;
  ledgerAllocated: string;
  ledgerHold: string;
  ledgerAvailable: string;
  resolution?: DiscrepancyResolution | null;
  resolvedById?: string | null;
  resolvedAt?: Date | null;
  note?: string | null;
}

const ZERO = new Prisma.Decimal(0);

export const ReconciliationService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: Prisma.ReconciliationRunWhereInput = {
      organizationId: orgId,
      ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
    };

    if (typeof query.status === 'string') {
      where.status = query.status as Prisma.EnumReconciliationRunStatusFilter['equals'];
    }

    const [data, total] = await Promise.all([
      prisma.reconciliationRun.findMany({
        where,
        include: {
          warehouse: { select: { name: true, code: true } },
          startedBy: { select: { name: true } },
          completedBy: { select: { name: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reconciliationRun.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, userId: string, id: string) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const run = await prisma.reconciliationRun.findFirst({
      where: {
        id,
        organizationId: orgId,
        ...(scope.global ? {} : { warehouseId: { in: scope.warehouseIds } }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        startedBy: { select: { name: true } },
        completedBy: { select: { name: true } },
        discrepancies: {
          include: {
            balance: {
              include: {
                product: { select: { name: true, sku: true } },
                variant: { select: { name: true, sku: true } },
                warehouse: { select: { name: true, code: true } },
                bin: { select: { code: true } },
              },
            },
            resolvedBy: { select: { name: true } },
          },
        },
      },
    });
    if (!run) throw AppError.notFound('Reconciliation run not found');
    return run;
  },

  async create(orgId: string, userId: string, data: { warehouseId?: string; note?: string }) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (data.warehouseId) {
      if (!scope.global && !scope.warehouseIds.includes(data.warehouseId)) {
        throw AppError.forbidden('You do not have access to this warehouse');
      }
    } else if (!scope.global) {
      throw AppError.badRequest('Warehouse ID is required for scoped users');
    }

    const run = await prisma.reconciliationRun.create({
      data: {
        organizationId: orgId,
        warehouseId: data.warehouseId ?? null,
        startedById: userId,
        note: data.note,
        status: 'PENDING',
      },
    });

    return run;
  },

  async start(orgId: string, userId: string, id: string) {
    return withInventoryTransaction(async (tx) => {
      const run = await tx.reconciliationRun.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!run) throw AppError.notFound('Reconciliation run not found');
      if (run.status !== 'PENDING') throw AppError.badRequest('Run is not in pending status');

      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && run.warehouseId && !scope.warehouseIds.includes(run.warehouseId)) {
        throw AppError.forbidden('You do not have access to this reconciliation run');
      }

      // Get balances to reconcile
      const warehouseFilter = run.warehouseId ? { warehouseId: run.warehouseId } : {};
      const balances = await tx.stockLevel.findMany({
        where: { organizationId: orgId, ...warehouseFilter },
        include: {
          product: { select: { name: true, sku: true } },
          variant: { select: { name: true, sku: true } },
          warehouse: { select: { name: true, code: true } },
          bin: { select: { code: true } },
        },
      });

      const movements = await tx.stockMovement.findMany({
        where: { organizationId: orgId, ...(run.warehouseId ? { warehouseId: run.warehouseId } : {}) },
        orderBy: { createdAt: 'asc' },
      });

      const ledger = new Map<string, { onHand: Prisma.Decimal; allocated: Prisma.Decimal; hold: Prisma.Decimal }>();
      for (const movement of movements) {
        if (!movement.stockLevelId) continue;
        const totals = ledger.get(movement.stockLevelId) ?? { onHand: ZERO, allocated: ZERO, hold: ZERO };
        ledger.set(movement.stockLevelId, {
          onHand: totals.onHand.plus(movement.onHandDelta),
          allocated: totals.allocated.plus(movement.allocatedDelta),
          hold: totals.hold.plus(movement.holdDelta),
        });
      }

      const discrepancies = [];
      for (const balance of balances) {
        const totals = ledger.get(balance.id) ?? { onHand: ZERO, allocated: ZERO, hold: ZERO };
        const available = totals.onHand.minus(totals.allocated).minus(totals.hold);
        const matches =
          totals.onHand.equals(balance.onHand) &&
          totals.allocated.equals(balance.allocated) &&
          totals.hold.equals(balance.hold) &&
          available.equals(balance.available);

        if (!matches) {
          discrepancies.push({
            runId: run.id,
            balanceId: balance.id,
            storedOnHand: balance.onHand,
            storedAllocated: balance.allocated,
            storedHold: balance.hold,
            storedAvailable: balance.available,
            ledgerOnHand: totals.onHand,
            ledgerAllocated: totals.allocated,
            ledgerHold: totals.hold,
            ledgerAvailable: available,
          });
        }
      }

      await tx.reconciliationDiscrepancy.createMany({ data: discrepancies });

      const updated = await tx.reconciliationRun.update({
        where: { id: run.id },
        data: {
          status: 'IN_PROGRESS',
          totalBalances: balances.length,
          discrepancyCount: discrepancies.length,
        },
      });

      return updated;
    });
  },

  async getDiscrepancies(orgId: string, userId: string, runId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);

    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, organizationId: orgId },
    });
    if (!run) throw AppError.notFound('Reconciliation run not found');

    if (!scope.global && run.warehouseId && !scope.warehouseIds.includes(run.warehouseId)) {
      throw AppError.forbidden('You do not have access to this reconciliation run');
    }

    const where: Prisma.ReconciliationDiscrepancyWhereInput = { runId };
    if (typeof query.resolution === 'string') {
      where.resolution = { equals: query.resolution as DiscrepancyResolution };
    }

    const [data, total] = await Promise.all([
      prisma.reconciliationDiscrepancy.findMany({
        where,
        include: {
          balance: {
            include: {
              product: { select: { name: true, sku: true } },
              variant: { select: { name: true, sku: true } },
              warehouse: { select: { name: true, code: true } },
              bin: { select: { code: true } },
            },
          },
          resolvedBy: { select: { name: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.reconciliationDiscrepancy.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async resolveDiscrepancy(orgId: string, userId: string, runId: string, discrepancyId: string, data: { resolution: DiscrepancyResolution; note?: string }) {
    return withInventoryTransaction(async (tx) => {
      const run = await tx.reconciliationRun.findFirst({
        where: { id: runId, organizationId: orgId },
      });
      if (!run) throw AppError.notFound('Reconciliation run not found');
      if (run.status !== 'IN_PROGRESS') throw AppError.badRequest('Run is not in progress');

      const discrepancy = await tx.reconciliationDiscrepancy.findFirst({
        where: { id: discrepancyId, runId },
        include: { balance: true },
      });
      if (!discrepancy) throw AppError.notFound('Discrepancy not found');
      if (discrepancy.resolution) throw AppError.conflict('Discrepancy already resolved');

      const resolution = data.resolution;
      let adjustmentId: string | undefined;

      if (resolution === 'ADJUST_STORED') {
        // Adjust stored balance to match ledger
        const balance = await tx.stockLevel.findUniqueOrThrow({ where: { id: discrepancy.balanceId } });
        const onHandDelta = discrepancy.ledgerOnHand.minus(discrepancy.storedOnHand);
        const allocatedDelta = discrepancy.ledgerAllocated.minus(discrepancy.storedAllocated);
        const holdDelta = discrepancy.ledgerHold.minus(discrepancy.storedHold);

        if (!onHandDelta.isZero() || !allocatedDelta.isZero() || !holdDelta.isZero()) {
          const reference = await DocumentSequenceService.next(tx, discrepancy.balance.organizationId, 'RECONCILIATION');
          await InventoryPostingService.post(tx, {
            organizationId: discrepancy.balance.organizationId,
            userId,
            balanceId: discrepancy.balanceId,
            type: 'ADJUSTMENT',
            quantity: onHandDelta.abs().plus(allocatedDelta.abs()).plus(holdDelta.abs()),
            onHandDelta,
            allocatedDelta,
            holdDelta,
            sourceDocumentType: 'RECONCILIATION',
            sourceDocumentId: runId,
            reference: `RECON:${runId}`,
            idempotencyKey: `RECON:${runId}:ADJUST:${discrepancyId}`,
            correlationId: `RECON:${runId}`,
            reasonCode: 'COUNT_VARIANCE',
            reason: `Reconciliation adjustment: ${data.note ?? 'Auto-adjusted to match ledger'}`,
          });
        }
      } else if (resolution === 'ADJUST_LEDGER') {
        // This would require a reversal and re-posting, which is complex
        // For now, we just mark it as resolved with note
        // In a full implementation, this would create reversing entries
      }
      // INVESTIGATE and IGNORE just mark as resolved without changes

      const resolved = await tx.reconciliationDiscrepancy.update({
        where: { id: discrepancyId },
        data: {
          resolution,
          resolvedById: userId,
          resolvedAt: new Date(),
          note: data.note,
        },
      });

      const resolvedCount = await tx.reconciliationDiscrepancy.count({
        where: { runId, resolution: { not: null } },
      });

      await tx.reconciliationRun.update({
        where: { id: runId },
        data: { resolvedCount },
      });

      return resolved;
    });
  },

  async complete(orgId: string, userId: string, id: string) {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!run) throw AppError.notFound('Reconciliation run not found');
    if (run.status !== 'IN_PROGRESS') throw AppError.badRequest('Run is not in progress');

    const unresolvedCount = await prisma.reconciliationDiscrepancy.count({
      where: { runId: id, resolution: null },
    });
    if (unresolvedCount > 0) {
      throw AppError.badRequest(`${unresolvedCount} discrepancies remain unresolved`);
    }

    const completed = await prisma.reconciliationRun.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedById: userId,
        completedAt: new Date(),
      },
    });

    return completed;
  },

  async cancel(orgId: string, userId: string, id: string) {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!run) throw AppError.notFound('Reconciliation run not found');
    if (run.status === 'COMPLETED') throw AppError.badRequest('Cannot cancel completed run');

    const cancelled = await prisma.reconciliationRun.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return cancelled;
  },
};