import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { InventoryPostingService, withInventoryTransaction } from '../inventory/inventory-posting.service';
import { validateInventoryIdentity } from '../inventory/inventory-validation';

export type ReturnStatus = 'OPEN' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
export type ReturnDisposition = 'RESTOCK' | 'DISCARD' | 'REWORK';

interface ReturnRecord {
  id: string;
  status: ReturnStatus;
  salesOrderId: string;
  warehouseId: string;
  quantity: string;
  disposition?: string | null;
}

export const ReturnsService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: any = {
      organizationId: orgId,
      ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        select: {
          id: true,
          status: true,
          salesOrderId: true,
          warehouseId: true,
          quantity: true,
          disposition: true,
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.returnRequest.count({ where }),
    ]);

    const items: ReturnRecord[] = rows.map((row: any) => ({
      id: row.id,
      status: row.status as ReturnStatus,
      salesOrderId: row.salesOrderId,
      warehouseId: row.warehouseId,
      quantity: row.quantity.toString(),
      disposition: row.disposition,
    }));

    return paginatedResult(items, total, pagination);
  },

  async create(orgId: string, userId: string, data: { salesOrderId: string; warehouseId: string; reason: string; quantity: string; note?: string }) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(data.warehouseId)) {
      throw AppError.forbidden('You do not have access to this warehouse');
    }

    const quantity = new Prisma.Decimal(data.quantity);
    if (quantity.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Return quantity must be greater than zero');
    }

    const item = await prisma.returnRequest.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        reason: data.reason,
        quantity,
        note: data.note ?? null,
        status: 'OPEN',
      },
    });

    return { id: item.id, status: item.status as ReturnStatus, salesOrderId: item.salesOrderId, warehouseId: item.warehouseId };
  },

  async approve(orgId: string, userId: string, id: string, data: { approved: boolean; note?: string }) {
    const req = await prisma.returnRequest.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!req) {
      throw AppError.notFound('Return request not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(req.warehouseId)) {
      throw AppError.forbidden('You do not have access to this return request');
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: {
        status: data.approved ? 'APPROVED' : 'REJECTED',
        note: data.note,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      status: updated.status as ReturnStatus,
      salesOrderId: updated.salesOrderId,
      warehouseId: updated.warehouseId,
      note: updated.note,
      approvedById: userId,
    };
  },

  async complete(orgId: string, userId: string, id: string, data: { disposition: 'RESTOCK' | 'DISCARD' | 'REWORK'; note?: string; idempotencyKey: string }) {
    return withInventoryTransaction(async (tx) => {
      const req = await tx.returnRequest.findFirst({
        where: { id, organizationId: orgId },
        include: { salesOrder: { include: { items: true } } },
      });

      if (!req) {
        throw AppError.notFound('Return request not found');
      }

      if (req.status !== 'APPROVED') {
        throw AppError.badRequest('Return request must be approved before completion');
      }

      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && !scope.warehouseIds.includes(req.warehouseId)) {
        throw AppError.forbidden('You do not have access to this return request');
      }

      // Check idempotency
      const duplicate = await tx.stockMovement.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: orgId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      });
      if (duplicate) {
        const existing = await tx.returnRequest.findUnique({ where: { id } });
        return {
          id: existing!.id,
          status: existing!.status as ReturnStatus,
          salesOrderId: existing!.salesOrderId,
          warehouseId: existing!.warehouseId,
          disposition: existing!.disposition,
          note: existing!.note,
          completedById: existing!.completedById,
        };
      }

      const quantity = new Prisma.Decimal(req.quantity);
      const disposition = data.disposition;

      // Find the sales order item to get product/variant info
      const salesOrderItem = req.salesOrder.items[0];
      if (!salesOrderItem) {
        throw AppError.badRequest('Sales order has no items');
      }

      // Validate inventory identity for the warehouse
      await validateInventoryIdentity(tx, {
        organizationId: orgId,
        productId: salesOrderItem.productId,
        variantId: salesOrderItem.variantId,
        warehouseId: req.warehouseId,
        binId: null,
      });

      // Ensure balance exists
      const balance = await InventoryPostingService.ensureBalance(tx, {
        organizationId: orgId,
        warehouseId: req.warehouseId,
        binId: null,
        productId: salesOrderItem.productId,
        variantId: salesOrderItem.variantId,
      });

      let movement = null;

      if (disposition === 'RESTOCK') {
        // Restock: increase onHand inventory
        movement = await InventoryPostingService.post(tx, {
          organizationId: orgId,
          userId,
          balanceId: balance.id,
          type: 'RETURN',
          quantity,
          onHandDelta: quantity,
          sourceDocumentType: 'RETURN_REQUEST',
          sourceDocumentId: req.id,
          reference: `RETURN:${req.id}`,
          idempotencyKey: data.idempotencyKey,
          correlationId: `RETURN:${req.id}`,
          reasonCode: 'RETURN_ADJUSTMENT',
          reason: `Return restocked: ${data.note ?? req.reason}`,
        });
      } else if (disposition === 'DISCARD') {
        // Discard: create adjustment with negative onHand
        movement = await InventoryPostingService.post(tx, {
          organizationId: orgId,
          userId,
          balanceId: balance.id,
          type: 'ADJUSTMENT',
          quantity,
          onHandDelta: quantity.negated(),
          sourceDocumentType: 'RETURN_REQUEST',
          sourceDocumentId: req.id,
          reference: `RETURN:${req.id}`,
          idempotencyKey: data.idempotencyKey,
          correlationId: `RETURN:${req.id}`,
          reasonCode: 'DAMAGE',
          reason: `Return discarded: ${data.note ?? req.reason}`,
        });
      } else if (disposition === 'REWORK') {
        // Rework: move to hold status (could be a separate bin in future)
        movement = await InventoryPostingService.post(tx, {
          organizationId: orgId,
          userId,
          balanceId: balance.id,
          type: 'ADJUSTMENT',
          quantity,
          onHandDelta: ZERO,
          holdDelta: quantity,
          sourceDocumentType: 'RETURN_REQUEST',
          sourceDocumentId: req.id,
          reference: `RETURN:${req.id}`,
          idempotencyKey: data.idempotencyKey,
          correlationId: `RETURN:${req.id}`,
          reasonCode: 'OTHER',
          reason: `Return sent for rework: ${data.note ?? req.reason}`,
        });
      }

      const completed = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          disposition: data.disposition,
          note: data.note,
          completedById: userId,
          completedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'RETURN_COMPLETED',
          entityType: 'ReturnRequest',
          entityId: id,
          newValues: JSON.stringify({
            disposition: data.disposition,
            note: data.note,
            movementId: movement?.movement?.id,
          }),
        },
      });

      return {
        id: completed.id,
        status: completed.status as ReturnStatus,
        salesOrderId: completed.salesOrderId,
        warehouseId: completed.warehouseId,
        disposition: completed.disposition,
        note: completed.note,
        completedById: userId,
      };
    });
  },
};

const ZERO = new Prisma.Decimal(0);
