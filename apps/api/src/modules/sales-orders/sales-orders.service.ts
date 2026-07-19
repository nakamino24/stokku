import { prisma, Prisma, SalesOrderStatus } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

const soInclude = {
  customer: true,
  items: { include: { product: { select: { name: true, sku: true, unit: true } }, variant: { select: { name: true, sku: true } } } },
  createdBy: { select: { name: true } },
} satisfies Prisma.SalesOrderInclude;

export const SalesOrderService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.SalesOrderWhereInput = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({ where, include: soInclude, skip: (pagination.page - 1) * pagination.limit, take: pagination.limit, orderBy: { createdAt: 'desc' } }),
      prisma.salesOrder.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const so = await prisma.salesOrder.findFirst({ where: { id, organizationId: orgId }, include: soInclude });
    if (!so) throw AppError.notFound('Sales order not found');
    return so;
  },

  async create(orgId: string, userId: string, data: any) {
    return (prisma.$transaction as any)(async (tx: any) => {
      const count = await tx.salesOrder.count({ where: { organizationId: orgId } });
      const soNumber = `SO-${String(count + 1).padStart(5, '0')}-${Date.now().toString(36).toUpperCase()}`;

      for (const item of data.items) {
        const stock = await tx.stockLevel.findFirst({
          where: { organizationId: orgId, productId: item.productId, variantId: item.variantId || '' },
        });
        if (!stock || stock.available < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
          throw AppError.badRequest(`Insufficient stock for ${product?.name || 'product'}`);
        }
      }

      const items = data.items.map((item: any) => ({
        productId: item.productId, variantId: item.variantId || null,
        quantity: item.quantity, unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((sum: number, i: any) => sum + Number(i.totalPrice), 0);
      const taxAmount = subtotal * (data.taxRate || 0);
      const totalAmount = subtotal + taxAmount;

      const so = await tx.salesOrder.create({
        data: {
          organizationId: orgId, soNumber, customerId: data.customerId,
          notes: data.notes, subtotal, taxAmount, totalAmount, createdById: userId,
          items: { create: items },
        },
        include: soInclude,
      });

      for (const item of data.items) {
        await tx.stockLevel.updateMany({
          where: { organizationId: orgId, productId: item.productId, variantId: item.variantId || '' },
          data: { reserved: { increment: item.quantity }, available: { decrement: item.quantity } },
        });
      }

      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'SalesOrder', entityId: so.id } });
      return so;
    });
  },

  async updateStatus(orgId: string, userId: string, id: string, status: SalesOrderStatus) {
    return (prisma.$transaction as any)(async (tx: any) => {
      const so = await tx.salesOrder.findFirst({ where: { id, organizationId: orgId } });
      if (!so) throw AppError.notFound('Sales order not found');

      const validTransitions: Record<string, string[]> = {
        DRAFT: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PICKING', 'CANCELLED'],
        PICKING: ['SHIPPING', 'CANCELLED'],
        SHIPPING: ['DELIVERED', 'CANCELLED'],
        DELIVERED: ['RETURNED'],
      };

      if (!validTransitions[so.status]?.includes(status)) {
        throw AppError.badRequest(`Cannot transition from ${so.status} to ${status}`);
      }

      if (status === 'DELIVERED') {
        const items = await tx.salesOrderItem.findMany({ where: { salesOrderId: id } });
        for (const item of items) {
          const stock = await tx.stockLevel.findFirst({
            where: { organizationId: orgId, productId: item.productId, variantId: item.variantId || '' },
          });
          if (stock) {
            await tx.stockLevel.update({
              where: { id: stock.id },
              data: { quantity: { decrement: item.quantity }, reserved: { decrement: item.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                organizationId: orgId, type: 'OUT', productId: item.productId,
                variantId: item.variantId || null, warehouseId: stock.warehouseId,
                stockLevelId: stock.id, quantity: -item.quantity,
                beforeQty: stock.quantity, afterQty: stock.quantity - item.quantity,
                referenceType: 'SALES_ORDER', referenceId: id, reference: so.soNumber, createdById: userId,
              },
            });
          }
        }
      }

      const updated = await tx.salesOrder.update({ where: { id }, data: { status }, include: soInclude });
      await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'SalesOrder', entityId: id } });
      return updated;
    });
  },
};
