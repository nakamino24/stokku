import { FulfillmentTaskStatus, Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { withInventoryTransaction } from '../inventory/inventory-posting.service';

export type PackStatus = 'READY' | 'CLAIMED' | 'PACKED' | 'EXCEPTION';

interface PackTaskRecord {
  id: string;
  status: PackStatus;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  quantity: string;
  salesOrderId: string;
  salesOrderItemId: string;
  pickedQty?: string | null;
  packedQty?: string | null;
  claimedById?: string | null;
}

const packStatuses = new Set<PackStatus>(['READY', 'CLAIMED', 'PACKED', 'EXCEPTION']);

function toPackTask(task: {
  id: string;
  executionStatus: FulfillmentTaskStatus;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  quantity: Prisma.Decimal;
  salesOrderId: string;
  salesOrderItemId: string;
  pickedQty: Prisma.Decimal | null;
  packedQty: Prisma.Decimal | null;
  claimedById: string | null;
}): PackTaskRecord {
  const status = task.executionStatus === 'PICKED' ? 'READY' : task.executionStatus === 'PACKING_CLAIMED' ? 'CLAIMED' : task.executionStatus;
  return {
    id: task.id,
    status: status as PackStatus,
    warehouseId: task.warehouseId,
    productId: task.productId,
    variantId: task.variantId,
    quantity: task.quantity.toString(),
    salesOrderId: task.salesOrderId,
    salesOrderItemId: task.salesOrderItemId,
    pickedQty: task.pickedQty?.toString() ?? null,
    packedQty: task.packedQty?.toString() ?? null,
    claimedById: task.claimedById,
  };
}

export const PackingService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);
    const requestedStatus = typeof query.status === 'string' && packStatuses.has(query.status as PackStatus)
      ? query.status as FulfillmentTaskStatus
      : undefined;
    const where: Prisma.InventoryAllocationWhereInput = {
      organizationId: orgId,
      status: 'ACTIVE',
      executionStatus: requestedStatus === 'READY' ? 'PICKED' : requestedStatus === 'CLAIMED' ? 'PACKING_CLAIMED' : requestedStatus ?? { in: ['PICKED', 'PACKING_CLAIMED', 'PACKED', 'EXCEPTION'] },
      ...(warehouseFilter ? { stockLevel: { warehouseId: warehouseFilter } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.inventoryAllocation.findMany({
        where,
        include: {
          salesOrderItem: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
          stockLevel: { select: { id: true, warehouseId: true, binId: true, productId: true, variantId: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.inventoryAllocation.count({ where }),
    ]);

    return paginatedResult(rows.map((row) => toPackTask({
      id: row.id,
      executionStatus: row.executionStatus,
      warehouseId: row.stockLevel.warehouseId,
      productId: row.stockLevel.productId,
      variantId: row.stockLevel.variantId ?? null,
      quantity: row.quantity,
      salesOrderId: row.salesOrderId,
      salesOrderItemId: row.salesOrderItemId,
      pickedQty: row.pickedQty,
      packedQty: row.packedQty,
      claimedById: row.claimedById,
    })), total, pagination);
  },

  async claim(orgId: string, userId: string, id: string) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({ where: { id, organizationId: orgId, status: 'ACTIVE' }, include: { stockLevel: true } });
      if (!task) throw AppError.notFound('Pack task not found');
      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && !scope.warehouseIds.includes(task.stockLevel.warehouseId)) throw AppError.forbidden('You do not have access to this pack task');
      if (task.executionStatus === 'PACKING_CLAIMED' && task.claimedById === userId) return toPackTask({ ...task, warehouseId: task.stockLevel.warehouseId, productId: task.stockLevel.productId, variantId: task.stockLevel.variantId ?? null });
      if (task.executionStatus !== 'PICKED') throw AppError.conflict('Pack task is not ready for packing');

      const claimed = await tx.inventoryAllocation.update({ where: { id }, data: { executionStatus: 'PACKING_CLAIMED', claimedById: userId, claimedAt: new Date() }, include: { stockLevel: true } });
      return toPackTask({ ...claimed, warehouseId: claimed.stockLevel.warehouseId, productId: claimed.stockLevel.productId, variantId: claimed.stockLevel.variantId ?? null });
    });
  },

  async complete(orgId: string, userId: string, id: string, data: { packedQty: string; cartons?: number; note?: string }) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({ where: { id, organizationId: orgId, status: 'ACTIVE' }, include: { stockLevel: true } });
      if (!task) throw AppError.notFound('Pack task not found');
      if (task.executionStatus !== 'PACKING_CLAIMED' || task.claimedById !== userId) throw AppError.conflict('Pack task must be claimed by the current operator');

      const quantity = new Prisma.Decimal(data.packedQty);
      const pickedQty = task.pickedQty ?? task.quantity;
      if (quantity.lessThanOrEqualTo(0) || quantity.greaterThan(pickedQty)) throw AppError.badRequest('Packed quantity must be greater than zero and cannot exceed the picked quantity');
      const packed = await tx.inventoryAllocation.update({ where: { id }, data: { executionStatus: 'PACKED', packedQty: quantity, packedAt: new Date() }, include: { stockLevel: true } });
      const remaining = await tx.inventoryAllocation.count({ where: { salesOrderId: task.salesOrderId, organizationId: orgId, status: 'ACTIVE', executionStatus: { not: 'PACKED' } } });
      if (remaining === 0) await tx.salesOrder.update({ where: { id: task.salesOrderId }, data: { status: 'PACKED', packedAt: new Date() } });
      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'PACK_CONFIRMED', entityType: 'InventoryAllocation', entityId: id, newValues: JSON.stringify({ packedQty: quantity.toString(), cartons: data.cartons ?? 1, note: data.note }) } });
      return { ...toPackTask({ ...packed, warehouseId: packed.stockLevel.warehouseId, productId: packed.stockLevel.productId, variantId: packed.stockLevel.variantId ?? null }), cartons: data.cartons ?? 1, note: data.note, packedById: userId };
    });
  },

  async exception(orgId: string, userId: string, id: string, data: { reason: string; note?: string }) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({ where: { id, organizationId: orgId, status: 'ACTIVE' }, include: { stockLevel: true } });
      if (!task) throw AppError.notFound('Pack task not found');
      if (task.executionStatus !== 'PACKING_CLAIMED' || task.claimedById !== userId) throw AppError.conflict('Pack task must be claimed by the current operator');
      const exception = await tx.inventoryAllocation.update({ where: { id }, data: { executionStatus: 'EXCEPTION', exceptionReason: data.reason }, include: { stockLevel: true } });
      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'PACK_EXCEPTION', entityType: 'InventoryAllocation', entityId: id, newValues: JSON.stringify({ reason: data.reason, note: data.note }) } });
      return { ...toPackTask({ ...exception, warehouseId: exception.stockLevel.warehouseId, productId: exception.stockLevel.productId, variantId: exception.stockLevel.variantId ?? null }), reason: data.reason, note: data.note, flaggedById: userId };
    });
  },
};
