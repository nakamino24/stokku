import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

export type ShipmentStatus = 'READY' | 'POSTED' | 'VOIDED';

interface ShipmentTaskRecord {
  id: string;
  status: ShipmentStatus;
  warehouseId: string;
  salesOrderId: string;
  trackingNumber?: string;
}

export const ShipmentService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: Prisma.SalesOrderWhereInput = {
      organizationId: orgId,
      status: 'PACKED',
      ...(warehouseFilter ? { items: { some: { allocations: { some: { stockLevel: { warehouseId: warehouseFilter } } } } } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          items: {
            include: {
              allocations: { include: { stockLevel: { select: { warehouseId: true, binId: true } } } },
            },
          },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.salesOrder.count({ where }),
    ]);

    const items: ShipmentTaskRecord[] = rows.map((row) => ({
      id: row.id,
      status: 'READY',
      warehouseId: row.items[0]?.allocations[0]?.stockLevel.warehouseId ?? '',
      salesOrderId: row.id,
      trackingNumber: undefined,
    }));

    return paginatedResult(items, total, pagination);
  },

  async post(orgId: string, userId: string, id: string, data: { trackingNumber: string; carrier: string; note?: string }) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, organizationId: orgId, status: 'PACKED' },
      include: { items: { include: { allocations: { include: { stockLevel: true } } } } },
    });

    if (!order) {
      throw AppError.notFound('Shipment not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    const orderWarehouseIds = order.items.flatMap((item) => item.allocations.map((alloc) => alloc.stockLevel.warehouseId));
    if (!scope.global && orderWarehouseIds.some((warehouseId) => !scope.warehouseIds.includes(warehouseId))) {
      throw AppError.forbidden('You do not have access to this shipment');
    }

    return {
      id: order.id,
      salesOrderId: order.id,
      status: 'POSTED' as const,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      note: data.note,
      postedById: userId,
    };
  },

  async voidShipment(orgId: string, userId: string, id: string, data: { reason: string; note?: string }) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, organizationId: orgId, status: 'POSTED' },
      include: { items: { include: { allocations: { include: { stockLevel: true } } } } },
    });

    if (!order) {
      throw AppError.notFound('Posted shipment not found');
    }

    return {
      id: order.id,
      salesOrderId: order.id,
      status: 'VOIDED' as const,
      reason: data.reason,
      note: data.note,
      voidedById: userId,
    };
  },
};
