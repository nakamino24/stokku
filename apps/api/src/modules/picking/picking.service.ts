import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

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
}

export const PickingService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: Prisma.InventoryAllocationWhereInput = {
      organizationId: orgId,
      status: 'ACTIVE',
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

    const items: PickTaskRecord[] = rows.map((row) => ({
      id: row.id,
      status: 'READY',
      warehouseId: row.stockLevel.warehouseId,
      productId: row.stockLevel.productId,
      variantId: row.stockLevel.variantId ?? null,
      quantity: row.quantity.toString(),
      salesOrderId: row.salesOrderId,
      salesOrderItemId: row.salesOrderItemId,
    }));

    return paginatedResult(items, total, pagination);
  },

  async claim(orgId: string, userId: string, id: string) {
    const task = await prisma.inventoryAllocation.findFirst({
      where: { id, organizationId: orgId, status: 'ACTIVE' },
      include: { stockLevel: true },
    });

    if (!task) {
      throw AppError.notFound('Pick task not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(task.stockLevel.warehouseId)) {
      throw AppError.forbidden('You do not have access to this pick task');
    }

    return {
      id: task.id,
      salesOrderId: task.salesOrderId,
      warehouseId: task.stockLevel.warehouseId,
      status: 'CLAIMED' as const,
      claimedById: userId,
      quantity: task.quantity.toString(),
    };
  },

  async confirm(orgId: string, userId: string, id: string, data: { pickedQty: string; note?: string }) {
    const task = await prisma.inventoryAllocation.findFirst({
      where: { id, organizationId: orgId, status: 'ACTIVE' },
      include: { stockLevel: true },
    });

    if (!task) {
      throw AppError.notFound('Pick task not found');
    }

    const quantity = new Prisma.Decimal(data.pickedQty);
    if (quantity.lessThanOrEqualTo(0) || quantity.greaterThan(task.quantity)) {
      throw AppError.badRequest('Picked quantity must be greater than zero and cannot exceed the allocated quantity');
    }

    return {
      id: task.id,
      salesOrderId: task.salesOrderId,
      warehouseId: task.stockLevel.warehouseId,
      status: 'PICKED' as const,
      pickedQty: quantity.toString(),
      note: data.note,
      pickedById: userId,
    };
  },

  async shortPick(orgId: string, userId: string, id: string, data: { shortQty: string; reason: string; note?: string }) {
    const task = await prisma.inventoryAllocation.findFirst({
      where: { id, organizationId: orgId, status: 'ACTIVE' },
      include: { stockLevel: true },
    });

    if (!task) {
      throw AppError.notFound('Pick task not found');
    }

    const shortQty = new Prisma.Decimal(data.shortQty);
    if (shortQty.lessThanOrEqualTo(0) || shortQty.greaterThan(task.quantity)) {
      throw AppError.badRequest('Short pick quantity must be positive and cannot exceed the allocated quantity');
    }

    return {
      id: task.id,
      salesOrderId: task.salesOrderId,
      warehouseId: task.stockLevel.warehouseId,
      status: 'SHORTED' as const,
      shortQty: shortQty.toString(),
      reason: data.reason,
      note: data.note,
      flaggedById: userId,
    };
  },
};
