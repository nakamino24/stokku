import { AdjustmentReasonCode, Prisma, prisma } from '@stokku/database';
import { DocumentSequenceService } from '../inventory/document-sequence.service';
import {
  DecimalInput,
  InventoryPostingService,
  withInventoryTransaction,
} from '../inventory/inventory-posting.service';
import { validateInventoryIdentity } from '../inventory/inventory-validation';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

interface AdjustmentInput {
  productId: string;
  variantId?: string | null;
  warehouseId: string;
  binId?: string | null;
  quantity: DecimalInput;
  reasonCode: AdjustmentReasonCode;
  reason?: string;
  note?: string;
  idempotencyKey: string;
}

interface TransferInput {
  productId: string;
  variantId?: string | null;
  fromWarehouseId: string;
  fromBinId?: string | null;
  toWarehouseId: string;
  toBinId?: string | null;
  quantity: DecimalInput;
  note?: string;
  idempotencyKey: string;
}

export const StockService = {
  async list(orgId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const where: Prisma.StockLevelWhereInput = { organizationId: orgId };

    if (typeof query.search === 'string' && query.search) {
      where.product = { name: { contains: query.search, mode: 'insensitive' } };
    }
    if (typeof query.warehouseId === 'string' && query.warehouseId) where.warehouseId = query.warehouseId;
    if (typeof query.productId === 'string' && query.productId) where.productId = query.productId;
    if (query.lowStock === 'true') {
      where.reorderPoint = { not: null };
      where.available = { lte: prisma.stockLevel.fields.reorderPoint };
    }

    const [data, total] = await Promise.all([
      prisma.stockLevel.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          variant: { select: { name: true, sku: true } },
          warehouse: { select: { name: true, code: true } },
          bin: { select: { code: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.stockLevel.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getMovements(orgId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const where: Prisma.StockMovementWhereInput = { organizationId: orgId };
    if (typeof query.productId === 'string') where.productId = query.productId;
    if (typeof query.warehouseId === 'string') where.warehouseId = query.warehouseId;
    if (typeof query.type === 'string') where.type = query.type as Prisma.EnumStockMovementTypeFilter['equals'];

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          variant: { select: { name: true } },
          warehouse: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async adjust(orgId: string, userId: string, data: AdjustmentInput) {
    const delta = new Prisma.Decimal(data.quantity);
    if (delta.isZero()) throw AppError.badRequest('Quantity must be non-zero');

    return withInventoryTransaction(async (tx) => {
      const duplicate = await tx.stockMovement.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: orgId,
            idempotencyKey: `ADJUSTMENT:${data.idempotencyKey}`,
          },
        },
      });
      if (duplicate?.stockLevelId) {
        return tx.stockLevel.findUniqueOrThrow({ where: { id: duplicate.stockLevelId } });
      }

      await validateInventoryIdentity(tx, {
        organizationId: orgId,
        productId: data.productId,
        variantId: data.variantId,
        warehouseId: data.warehouseId,
        binId: data.binId,
      });
      const balance = await InventoryPostingService.ensureBalance(tx, {
        organizationId: orgId,
        warehouseId: data.warehouseId,
        binId: data.binId,
        productId: data.productId,
        variantId: data.variantId,
      });
      const result = await InventoryPostingService.adjust(tx, {
        organizationId: orgId,
        userId,
        balanceId: balance.id,
        quantityDelta: delta,
        reasonCode: data.reasonCode,
        reason: data.reason,
        note: data.note,
        sourceDocumentType: 'STOCK_ADJUSTMENT',
        reference: await DocumentSequenceService.next(tx, orgId, 'STOCK_ADJUSTMENT'),
        idempotencyKey: `ADJUSTMENT:${data.idempotencyKey}`,
        correlationId: data.idempotencyKey,
      });
      return result.balance;
    });
  },

  async reverseAdjustment(
    orgId: string,
    userId: string,
    movementId: string,
    data: { idempotencyKey: string; reason: string },
  ) {
    return withInventoryTransaction(async (tx) => {
      const movement = await tx.stockMovement.findFirst({
        where: { id: movementId, organizationId: orgId },
        select: { type: true },
      });
      if (!movement) throw AppError.notFound('Inventory transaction not found');
      if (movement.type !== 'ADJUSTMENT') {
        throw AppError.badRequest('Only stock adjustments can be reversed through this endpoint');
      }
      return InventoryPostingService.reverse(tx, {
        organizationId: orgId,
        userId,
        movementId,
        idempotencyKey: `REVERSAL:${data.idempotencyKey}`,
        reason: data.reason,
      });
    });
  },

  async transfer(orgId: string, userId: string, data: TransferInput) {
    if (data.fromWarehouseId === data.toWarehouseId && (data.fromBinId ?? null) === (data.toBinId ?? null)) {
      throw AppError.badRequest('Source and destination inventory locations must be different');
    }
    const requested = new Prisma.Decimal(data.quantity);
    if (requested.lessThanOrEqualTo(0)) throw AppError.badRequest('Transfer quantity must be positive');

    return withInventoryTransaction(async (tx) => {
      const correlationId = `TRANSFER:${data.idempotencyKey}`;
      const duplicate = await tx.stockMovement.findFirst({
        where: { organizationId: orgId, correlationId },
      });
      if (duplicate) return { duplicate: true, reference: duplicate.reference };

      await Promise.all([
        validateInventoryIdentity(tx, {
          organizationId: orgId,
          productId: data.productId,
          variantId: data.variantId,
          warehouseId: data.fromWarehouseId,
          binId: data.fromBinId,
        }),
        validateInventoryIdentity(tx, {
          organizationId: orgId,
          productId: data.productId,
          variantId: data.variantId,
          warehouseId: data.toWarehouseId,
          binId: data.toBinId,
        }),
      ]);

      const sourceBalances = await tx.stockLevel.findMany({
        where: {
          organizationId: orgId,
          warehouseId: data.fromWarehouseId,
          binId: data.fromBinId ?? undefined,
          productId: data.productId,
          variantId: data.variantId ?? null,
          inventoryStatus: 'AVAILABLE',
          available: { gt: 0 },
        },
        orderBy: [{ binId: 'asc' }, { createdAt: 'asc' }],
      });
      const totalAvailable = sourceBalances.reduce(
        (sum, balance) => sum.plus(balance.available),
        new Prisma.Decimal(0),
      );
      if (totalAvailable.lessThan(requested)) {
        throw AppError.conflict('Insufficient available stock in source warehouse');
      }

      const reference = await DocumentSequenceService.next(tx, orgId, 'STOCK_TRANSFER');
      const destination = await InventoryPostingService.ensureBalance(tx, {
        organizationId: orgId,
        warehouseId: data.toWarehouseId,
        binId: data.toBinId,
        productId: data.productId,
        variantId: data.variantId,
      });

      let remaining = requested;
      let index = 0;
      for (const source of sourceBalances) {
        if (remaining.lessThanOrEqualTo(0)) break;
        const available = new Prisma.Decimal(source.available);
        const quantity = available.lessThan(remaining) ? available : remaining;

        await InventoryPostingService.post(tx, {
          organizationId: orgId,
          userId,
          balanceId: source.id,
          type: 'TRANSFER_OUT',
          quantity,
          onHandDelta: quantity.negated(),
          sourceDocumentType: 'STOCK_TRANSFER',
          reference,
          idempotencyKey: `${correlationId}:OUT:${index}`,
          correlationId,
          note: data.note,
        });
        await InventoryPostingService.post(tx, {
          organizationId: orgId,
          userId,
          balanceId: destination.id,
          type: 'TRANSFER_IN',
          quantity,
          onHandDelta: quantity,
          sourceDocumentType: 'STOCK_TRANSFER',
          reference,
          idempotencyKey: `${correlationId}:IN:${index}`,
          correlationId,
          note: data.note,
        });
        remaining = remaining.minus(quantity);
        index += 1;
      }

      return { duplicate: false, reference, transferredQuantity: requested.toString() };
    });
  },

  reconcile(orgId: string) {
    return InventoryPostingService.reconcile(orgId);
  },
};
