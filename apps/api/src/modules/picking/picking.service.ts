import { FulfillmentTaskStatus, Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { withInventoryTransaction } from '../inventory/inventory-posting.service';

export type PickStatus = 'READY' | 'CLAIMED' | 'PICKED' | 'SHORTED';

interface PickTaskRecord {
  id: string;
  status: PickStatus;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  quantity: string;
  salesOrderId: string;
  salesOrderItemId: string;
  pickedQty?: string | null;
  shortQty?: string | null;
  claimedById?: string | null;
}

const pickStatuses = new Set<PickStatus>(['READY', 'CLAIMED', 'PICKED', 'SHORTED']);

function toPickTask(task: {
  id: string;
  executionStatus: FulfillmentTaskStatus;
  warehouseId: string;
  productId: string;
  variantId: string | null;
  quantity: Prisma.Decimal;
  salesOrderId: string;
  salesOrderItemId: string;
  pickedQty: Prisma.Decimal | null;
  shortQty: Prisma.Decimal | null;
  claimedById: string | null;
}): PickTaskRecord {
  const status = task.executionStatus === 'PACKING_CLAIMED' || task.executionStatus === 'PACKED'
    ? 'PICKED'
    : task.executionStatus;
  return {
    id: task.id,
    status: status as PickStatus,
    warehouseId: task.warehouseId,
    productId: task.productId,
    variantId: task.variantId,
    quantity: task.quantity.toString(),
    salesOrderId: task.salesOrderId,
    salesOrderItemId: task.salesOrderItemId,
    pickedQty: task.pickedQty?.toString() ?? null,
    shortQty: task.shortQty?.toString() ?? null,
    claimedById: task.claimedById,
  };
}

export const PickingService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);
    const requestedStatus = typeof query.status === 'string' && pickStatuses.has(query.status as PickStatus)
      ? query.status as FulfillmentTaskStatus
      : undefined;
    const where: Prisma.InventoryAllocationWhereInput = {
      organizationId: orgId,
      status: 'ACTIVE',
      executionStatus: requestedStatus ?? { in: ['READY', 'CLAIMED', 'PICKED', 'SHORTED'] },
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

    const items = rows.map((row) => toPickTask({
      id: row.id,
      executionStatus: row.executionStatus,
      warehouseId: row.stockLevel.warehouseId,
      productId: row.stockLevel.productId,
      variantId: row.stockLevel.variantId ?? null,
      quantity: row.quantity,
      salesOrderId: row.salesOrderId,
      salesOrderItemId: row.salesOrderItemId,
      pickedQty: row.pickedQty,
      shortQty: row.shortQty,
      claimedById: row.claimedById,
    }));

    return paginatedResult(items, total, pagination);
  },

  async claim(orgId: string, userId: string, id: string) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({
        where: { id, organizationId: orgId, status: 'ACTIVE' },
        include: { stockLevel: true },
      });
      if (!task) throw AppError.notFound('Pick task not found');

      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && !scope.warehouseIds.includes(task.stockLevel.warehouseId)) {
        throw AppError.forbidden('You do not have access to this pick task');
      }
      if (task.executionStatus === 'CLAIMED' && task.claimedById === userId) return toPickTask({ ...task, warehouseId: task.stockLevel.warehouseId, productId: task.stockLevel.productId, variantId: task.stockLevel.variantId ?? null });
      if (task.executionStatus !== 'READY') throw AppError.conflict('Pick task is no longer ready');

      const claimed = await tx.inventoryAllocation.update({
        where: { id },
        data: { executionStatus: 'CLAIMED', claimedById: userId, claimedAt: new Date() },
        include: { stockLevel: true },
      });
      return toPickTask({ ...claimed, warehouseId: claimed.stockLevel.warehouseId, productId: claimed.stockLevel.productId, variantId: claimed.stockLevel.variantId ?? null });
    });
  },

  async confirm(orgId: string, userId: string, id: string, data: { pickedQty: string; note?: string }) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({ where: { id, organizationId: orgId, status: 'ACTIVE' }, include: { stockLevel: true } });
      if (!task) throw AppError.notFound('Pick task not found');
      if (task.executionStatus !== 'CLAIMED' || task.claimedById !== userId) throw AppError.conflict('Pick task must be claimed by the current operator');

      const quantity = new Prisma.Decimal(data.pickedQty);
      if (quantity.lessThanOrEqualTo(0) || quantity.greaterThan(task.quantity)) throw AppError.badRequest('Picked quantity must be greater than zero and cannot exceed the allocated quantity');
      const picked = await tx.inventoryAllocation.update({ where: { id }, data: { executionStatus: 'PICKED', pickedQty: quantity, pickedAt: new Date() }, include: { stockLevel: true } });
      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'PICK_CONFIRMED', entityType: 'InventoryAllocation', entityId: id, newValues: JSON.stringify({ pickedQty: quantity.toString(), note: data.note }) } });
      return { ...toPickTask({ ...picked, warehouseId: picked.stockLevel.warehouseId, productId: picked.stockLevel.productId, variantId: picked.stockLevel.variantId ?? null }), note: data.note, pickedById: userId };
    });
  },

  async shortPick(orgId: string, userId: string, id: string, data: { shortQty: string; reason: string; note?: string }) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.inventoryAllocation.findFirst({ where: { id, organizationId: orgId, status: 'ACTIVE' }, include: { stockLevel: true } });
      if (!task) throw AppError.notFound('Pick task not found');
      if (task.executionStatus !== 'CLAIMED' || task.claimedById !== userId) throw AppError.conflict('Pick task must be claimed by the current operator');

      const shortQty = new Prisma.Decimal(data.shortQty);
      if (shortQty.lessThanOrEqualTo(0) || shortQty.greaterThan(task.quantity)) throw AppError.badRequest('Short pick quantity must be positive and cannot exceed the allocated quantity');
      const shortened = await tx.inventoryAllocation.update({ where: { id }, data: { executionStatus: 'SHORTED', shortQty, exceptionReason: data.reason }, include: { stockLevel: true } });
      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'PICK_SHORTED', entityType: 'InventoryAllocation', entityId: id, newValues: JSON.stringify({ shortQty: shortQty.toString(), reason: data.reason, note: data.note }) } });
      return { ...toPickTask({ ...shortened, warehouseId: shortened.stockLevel.warehouseId, productId: shortened.stockLevel.productId, variantId: shortened.stockLevel.variantId ?? null }), reason: data.reason, note: data.note, flaggedById: userId };
    });
  },
};
