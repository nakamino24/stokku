import { Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { InventoryPostingService, InventoryTransaction } from './inventory-posting.service';

interface AllocationCommand {
  organizationId: string;
  userId: string;
  salesOrderId: string;
  reference: string;
}

export const InventoryAllocationService = {
  async allocateSalesOrder(tx: InventoryTransaction, command: AllocationCommand) {
    const order = await tx.salesOrder.findFirst({
      where: { id: command.salesOrderId, organizationId: command.organizationId },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    if (!order) throw AppError.notFound('Sales order not found');

    const existing = await tx.inventoryAllocation.findMany({
      where: { salesOrderId: order.id, organizationId: command.organizationId, status: 'ACTIVE' },
    });
    if (existing.length > 0) return existing;

    const created = [];
    for (const item of order.items) {
      let remaining = new Prisma.Decimal(item.quantity);
      const balances = await tx.stockLevel.findMany({
        where: {
          organizationId: command.organizationId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          inventoryStatus: 'AVAILABLE',
          available: { gt: 0 },
        },
        orderBy: [{ warehouseId: 'asc' }, { binId: 'asc' }, { createdAt: 'asc' }],
      });

      for (const balance of balances) {
        if (!remaining.isPositive()) break;
        const available = new Prisma.Decimal(balance.available);
        const quantity = available.lessThan(remaining) ? available : remaining;
        if (!quantity.isPositive()) continue;

        await InventoryPostingService.post(tx, {
          organizationId: command.organizationId,
          userId: command.userId,
          balanceId: balance.id,
          type: 'ALLOCATION',
          quantity,
          allocatedDelta: quantity,
          sourceDocumentType: 'SALES_ORDER',
          sourceDocumentId: order.id,
          reference: command.reference,
          idempotencyKey: `SO:${order.id}:ALLOCATE:${item.id}:${balance.id}`,
          correlationId: `SO:${order.id}`,
        });

        created.push(await tx.inventoryAllocation.create({
          data: {
            organizationId: command.organizationId,
            salesOrderId: order.id,
            salesOrderItemId: item.id,
            stockLevelId: balance.id,
            quantity,
            idempotencyKey: `SO:${order.id}:ITEM:${item.id}:BALANCE:${balance.id}`,
            createdById: command.userId,
          },
        }));
        remaining = remaining.minus(quantity);
      }

      if (remaining.isPositive()) {
        throw AppError.conflict(
          `Insufficient available inventory for ${item.product.name}; short by ${remaining.toString()}`,
        );
      }
    }

    await tx.auditLog.create({
      data: {
        organizationId: command.organizationId,
        userId: command.userId,
        action: 'SALES_ORDER_ALLOCATED',
        entityType: 'SalesOrder',
        entityId: order.id,
        newValues: JSON.stringify({ allocationCount: created.length }),
      },
    });
    return created;
  },

  async releaseSalesOrder(tx: InventoryTransaction, command: AllocationCommand) {
    const allocations = await tx.inventoryAllocation.findMany({
      where: {
        salesOrderId: command.salesOrderId,
        organizationId: command.organizationId,
        status: 'ACTIVE',
      },
    });

    for (const allocation of allocations) {
      await InventoryPostingService.post(tx, {
        organizationId: command.organizationId,
        userId: command.userId,
        balanceId: allocation.stockLevelId,
        type: 'DEALLOCATION',
        quantity: allocation.quantity,
        allocatedDelta: allocation.quantity.negated(),
        sourceDocumentType: 'SALES_ORDER',
        sourceDocumentId: command.salesOrderId,
        reference: command.reference,
        idempotencyKey: `SO:${command.salesOrderId}:DEALLOCATE:${allocation.id}`,
        correlationId: `SO:${command.salesOrderId}`,
      });
      await tx.inventoryAllocation.update({
        where: { id: allocation.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
    }
    return allocations.length;
  },

  async shipSalesOrder(tx: InventoryTransaction, command: AllocationCommand) {
    const allocations = await tx.inventoryAllocation.findMany({
      where: {
        salesOrderId: command.salesOrderId,
        organizationId: command.organizationId,
        status: 'ACTIVE',
      },
    });
    if (allocations.length === 0) throw AppError.conflict('Sales order has no active allocation to ship');

    for (const allocation of allocations) {
      await InventoryPostingService.post(tx, {
        organizationId: command.organizationId,
        userId: command.userId,
        balanceId: allocation.stockLevelId,
        type: 'SHIPMENT',
        quantity: allocation.quantity,
        onHandDelta: allocation.quantity.negated(),
        allocatedDelta: allocation.quantity.negated(),
        sourceDocumentType: 'SALES_ORDER',
        sourceDocumentId: command.salesOrderId,
        reference: command.reference,
        idempotencyKey: `SO:${command.salesOrderId}:SHIP:${allocation.id}`,
        correlationId: `SO:${command.salesOrderId}`,
      });
      await tx.inventoryAllocation.update({
        where: { id: allocation.id },
        data: { status: 'FULFILLED', fulfilledAt: new Date() },
      });
    }
    return allocations.length;
  },
};
