import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

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
}

export const PackingService = {
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

    const items: PackTaskRecord[] = rows.map((row) => ({
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
      throw AppError.notFound('Pack task not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(task.stockLevel.warehouseId)) {
      throw AppError.forbidden('You do not have access to this pack task');
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

  async complete(orgId: string, userId: string, id: string, data: { packedQty: string; cartons?: number; note?: string }) {
    const task = await prisma.inventoryAllocation.findFirst({
      where: { id, organizationId: orgId, status: 'ACTIVE' },
      include: { stockLevel: true },
    });

    if (!task) {
      throw AppError.notFound('Pack task not found');
    }

    const quantity = new Prisma.Decimal(data.packedQty);
    if (quantity.lessThanOrEqualTo(0) || quantity.greaterThan(task.quantity)) {
      throw AppError.badRequest('Packed quantity must be greater than zero and cannot exceed the allocated quantity');
    }

    return {
      id: task.id,
      salesOrderId: task.salesOrderId,
      warehouseId: task.stockLevel.warehouseId,
      status: 'PACKED' as const,
      packedQty: quantity.toString(),
      cartons: data.cartons ?? 1,
      note: data.note,
      packedById: userId,
    };
  },

  async exception(orgId: string, userId: string, id: string, data: { reason: string; note?: string }) {
    const task = await prisma.inventoryAllocation.findFirst({
      where: { id, organizationId: orgId, status: 'ACTIVE' },
      include: { stockLevel: true },
    });

    if (!task) {
      throw AppError.notFound('Pack task not found');
    }

    return {
      id: task.id,
      salesOrderId: task.salesOrderId,
      warehouseId: task.stockLevel.warehouseId,
      status: 'EXCEPTION' as const,
      reason: data.reason,
      note: data.note,
      flaggedById: userId,
    };
  },
};
