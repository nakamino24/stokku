import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { InventoryAllocationService } from '../inventory/inventory-allocation.service';
import { InventoryPostingService, withInventoryTransaction } from '../inventory/inventory-posting.service';

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

  async post(orgId: string, userId: string, id: string, data: { trackingNumber: string; carrier: string; note?: string; idempotencyKey: string }) {
    return withInventoryTransaction(async (tx) => {
      const duplicate = await tx.shipment.findUnique({
        where: { organizationId_idempotencyKey: { organizationId: orgId, idempotencyKey: data.idempotencyKey } },
      });
      if (duplicate) return duplicate;

      const order = await tx.salesOrder.findFirst({
        where: { id, organizationId: orgId, status: 'PACKED' },
        include: { items: { include: { allocations: { include: { stockLevel: true } } } } },
      });
      if (!order) throw AppError.notFound('Packed sales order not found');

      const scope = await getWarehouseScope(tx, orgId, userId);
      const orderWarehouseIds = order.items.flatMap((item) => item.allocations.map((alloc) => alloc.stockLevel.warehouseId));
      if (!scope.global && orderWarehouseIds.some((warehouseId) => !scope.warehouseIds.includes(warehouseId))) {
        throw AppError.forbidden('You do not have access to this shipment');
      }
      if (orderWarehouseIds.length === 0) throw AppError.conflict('Sales order has no active allocation to ship');

      await InventoryAllocationService.shipSalesOrder(tx, {
        organizationId: orgId,
        userId,
        salesOrderId: order.id,
        reference: order.soNumber,
      });

      const shippedAt = new Date();
      await tx.salesOrder.update({ where: { id: order.id }, data: { status: 'SHIPPED', shippedAt } });
      const shipment = await tx.shipment.create({
        data: {
          organizationId: orgId,
          salesOrderId: order.id,
          trackingNumber: data.trackingNumber,
          carrier: data.carrier,
          note: data.note,
          idempotencyKey: data.idempotencyKey,
          postedById: userId,
          postedAt: shippedAt,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'SHIPMENT_POSTED',
          entityType: 'Shipment',
          entityId: shipment.id,
          newValues: JSON.stringify({ salesOrderId: order.id, trackingNumber: data.trackingNumber, carrier: data.carrier }),
        },
      });
      return shipment;
    });
  },

  async voidShipment(orgId: string, userId: string, id: string, data: { reason: string; note?: string; idempotencyKey: string }) {
    return withInventoryTransaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { organizationId: orgId, salesOrderId: id },
        include: { salesOrder: { include: { allocations: { include: { stockLevel: true } } } } },
      });
      if (!shipment) throw AppError.notFound('Posted shipment not found');
      if (shipment.status === 'VOIDED') return shipment;

      const warehouseIds = shipment.salesOrder.allocations.map((allocation) => allocation.stockLevel.warehouseId);
      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && warehouseIds.some((warehouseId) => !scope.warehouseIds.includes(warehouseId))) {
        throw AppError.forbidden('You do not have access to this shipment');
      }

      const movements = await tx.stockMovement.findMany({
        where: { organizationId: orgId, sourceDocumentType: 'SALES_ORDER', sourceDocumentId: id, type: 'SHIPMENT' },
      });
      for (const movement of movements) {
        await InventoryPostingService.reverse(tx, {
          organizationId: orgId,
          userId,
          movementId: movement.id,
          idempotencyKey: `SHIPMENT_VOID:${data.idempotencyKey}:${movement.id}`,
          reason: data.reason,
        });
      }

      await tx.inventoryAllocation.updateMany({
        where: { organizationId: orgId, salesOrderId: id, status: 'FULFILLED' },
        data: { status: 'ACTIVE', fulfilledAt: null },
      });
      await tx.salesOrder.update({ where: { id }, data: { status: 'PACKED', shippedAt: null } });
      const voided = await tx.shipment.update({
        where: { id: shipment.id },
        data: { status: 'VOIDED', voidedAt: new Date(), voidReason: data.reason },
      });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'SHIPMENT_VOIDED',
          entityType: 'Shipment',
          entityId: shipment.id,
          newValues: JSON.stringify({ salesOrderId: id, reason: data.reason, note: data.note }),
        },
      });
      return voided;
    });
  },
};
