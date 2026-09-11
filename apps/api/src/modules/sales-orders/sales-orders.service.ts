import { Prisma, SalesOrderStatus, prisma } from '@stokku/database';
import { DocumentSequenceService } from '../inventory/document-sequence.service';
import { InventoryAllocationService } from '../inventory/inventory-allocation.service';
import { DecimalInput, withInventoryTransaction } from '../inventory/inventory-posting.service';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

interface SalesOrderInput {
  customerId: string;
  notes?: string;
  taxRate?: DecimalInput;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: DecimalInput;
    unitPrice: DecimalInput;
  }>;
}

const soInclude = {
  customer: true,
  items: {
    include: {
      product: { select: { name: true, sku: true, unit: true } },
      variant: { select: { name: true, sku: true } },
      allocations: {
        include: {
          stockLevel: {
            include: {
              warehouse: { select: { id: true, name: true, code: true } },
              bin: { select: { id: true, code: true } },
            },
          },
        },
      },
    },
  },
  createdBy: { select: { name: true } },
} satisfies Prisma.SalesOrderInclude;

const soListSelect = {
  id: true,
  soNumber: true,
  status: true,
  orderDate: true,
  totalAmount: true,
  customer: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.SalesOrderSelect;

export const SalesOrderService = {
  async list(orgId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const where: Prisma.SalesOrderWhereInput = { organizationId: orgId };
    if (typeof query.status === 'string') where.status = query.status as SalesOrderStatus;
    if (typeof query.customerId === 'string') where.customerId = query.customerId;

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        select: soListSelect,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.salesOrder.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, organizationId: orgId },
      include: soInclude,
    });
    if (!order) throw AppError.notFound('Sales order not found');
    return order;
  },

  async create(orgId: string, userId: string, data: SalesOrderInput) {
    return withInventoryTransaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: data.customerId, organizationId: orgId, isActive: true },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const items = [];
      for (const input of data.items) {
        const product = await tx.product.findFirst({
          where: { id: input.productId, organizationId: orgId, isActive: true },
        });
        if (!product) throw AppError.notFound('Product not found');
        if (input.variantId) {
          const variant = await tx.productVariant.findFirst({
            where: { id: input.variantId, productId: input.productId, isActive: true },
          });
          if (!variant) throw AppError.notFound('Product variant not found');
        }

        const quantity = new Prisma.Decimal(input.quantity);
        const unitPrice = new Prisma.Decimal(input.unitPrice);
        items.push({
          productId: input.productId,
          variantId: input.variantId ?? null,
          quantity,
          unitPrice,
          totalPrice: quantity.times(unitPrice),
        });
      }

      const subtotal = items.reduce(
        (sum, item) => sum.plus(item.totalPrice),
        new Prisma.Decimal(0),
      );
      const taxRate = new Prisma.Decimal(data.taxRate ?? 0);
      const taxAmount = subtotal.times(taxRate);
      const totalAmount = subtotal.plus(taxAmount);
      const soNumber = await DocumentSequenceService.next(tx, orgId, 'SALES_ORDER');

      const order = await tx.salesOrder.create({
        data: {
          organizationId: orgId,
          soNumber,
          customerId: data.customerId,
          notes: data.notes,
          subtotal,
          taxAmount,
          totalAmount,
          createdById: userId,
          items: { create: items },
        },
        include: soInclude,
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'CREATE',
          entityType: 'SalesOrder',
          entityId: order.id,
          newValues: JSON.stringify({ status: 'DRAFT', soNumber }),
        },
      });
      return order;
    });
  },

  async updateStatus(orgId: string, userId: string, id: string, requestedStatus: SalesOrderStatus) {
    return withInventoryTransaction(async (tx) => {
      const order = await tx.salesOrder.findFirst({
        where: { id, organizationId: orgId },
        include: soInclude,
      });
      if (!order) throw AppError.notFound('Sales order not found');

      if (order.status === requestedStatus) return order;

      const validTransitions: Record<SalesOrderStatus, SalesOrderStatus[]> = {
        DRAFT: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['ALLOCATED', 'CANCELLED'],
        ALLOCATED: ['PICKING', 'CANCELLED'],
        PICKING: ['PICKED', 'CANCELLED'],
        PICKED: ['PACKED', 'CANCELLED'],
        PACKED: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: ['CLOSED', 'RETURNED'],
        CLOSED: [],
        CANCELLED: [],
        RETURNED: [],
      };

      if (!validTransitions[order.status].includes(requestedStatus)) {
        throw AppError.badRequest(`Cannot transition from ${order.status} to ${requestedStatus}`);
      }

      let nextStatus = requestedStatus;
      const now = new Date();
      const timestamps: Prisma.SalesOrderUpdateInput = {};

      if (requestedStatus === 'CONFIRMED') {
        timestamps.confirmedAt = order.confirmedAt ?? now;
      } else if (requestedStatus === 'ALLOCATED') {
        await InventoryAllocationService.allocateSalesOrder(tx, {
          organizationId: orgId,
          userId,
          salesOrderId: id,
          reference: order.soNumber,
        });
        timestamps.allocatedAt = now;
      } else if (requestedStatus === 'CANCELLED') {
        const activeAllocations = await tx.inventoryAllocation.count({
          where: { salesOrderId: id, organizationId: orgId, status: 'ACTIVE' },
        });
        if (activeAllocations > 0) {
          await InventoryAllocationService.releaseSalesOrder(tx, {
            organizationId: orgId,
            userId,
            salesOrderId: id,
            reference: order.soNumber,
          });
        }
        timestamps.cancelledAt = now;
      } else if (requestedStatus === 'SHIPPED') {
        await InventoryAllocationService.shipSalesOrder(tx, {
          organizationId: orgId,
          userId,
          salesOrderId: id,
          reference: order.soNumber,
        });
        timestamps.shippedAt = now;
      } else if (requestedStatus === 'PICKED') {
        timestamps.pickedAt = now;
      } else if (requestedStatus === 'PACKED') {
        timestamps.packedAt = now;
      } else if (requestedStatus === 'DELIVERED') {
        // Delivery is a business milestone. Physical inventory was already
        // relieved exactly once when the shipment was posted.
        timestamps.deliveredAt = now;
      } else if (requestedStatus === 'CLOSED') {
        timestamps.closedAt = now;
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: nextStatus, ...timestamps },
        include: soInclude,
      });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'STATUS_CHANGE',
          entityType: 'SalesOrder',
          entityId: id,
          oldValues: JSON.stringify({ status: order.status }),
          newValues: JSON.stringify({ status: nextStatus }),
        },
      });
      return updated;
    });
  },
};
