import { prisma, Prisma, PurchaseOrderStatus } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

const poInclude = {
  supplier: true,
  items: { include: { product: { select: { name: true, sku: true, unit: true } }, variant: { select: { name: true, sku: true } } } },
  createdBy: { select: { name: true } },
} satisfies Prisma.PurchaseOrderInclude;

export const PurchaseOrderService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.PurchaseOrderWhereInput = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, include: poInclude, skip: (pagination.page - 1) * pagination.limit, take: pagination.limit, orderBy: { createdAt: 'desc' } }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, organizationId: orgId }, include: poInclude });
    if (!po) throw AppError.notFound('Purchase order not found');
    return po;
  },

  async create(orgId: string, userId: string, data: any) {
    const count = await prisma.purchaseOrder.count({ where: { organizationId: orgId } });
    const poNumber = `PO-${String(count + 1).padStart(5, '0')}-${Date.now().toString(36).toUpperCase()}`;

    const items = data.items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.totalPrice), 0);
    const taxAmount = subtotal * (data.taxRate || 0);
    const totalAmount = subtotal + taxAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: orgId, poNumber, supplierId: data.supplierId,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes, subtotal, taxAmount, totalAmount, createdById: userId,
        items: { create: items },
      },
      include: poInclude,
    });

    await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'PurchaseOrder', entityId: po.id } });
    return po;
  },

  async updateStatus(orgId: string, userId: string, id: string, status: PurchaseOrderStatus) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, organizationId: orgId } });
    if (!po) throw AppError.notFound('Purchase order not found');

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
      PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
      APPROVED: ['SENT', 'CANCELLED'],
      SENT: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
      PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
    };

    if (!validTransitions[po.status]?.includes(status)) {
      throw AppError.badRequest(`Cannot transition from ${po.status} to ${status}`);
    }

    const updateData: any = { status };
    if (status === 'RECEIVED') updateData.receivedDate = new Date();

    const updated = await prisma.purchaseOrder.update({ where: { id }, data: updateData, include: poInclude });
    await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'PurchaseOrder', entityId: id } });
    return updated;
  },

  async receive(orgId: string, userId: string, warehouseId: string, id: string, items: { itemId: string; receivedQty: number }[]) {
    if (!warehouseId) throw AppError.badRequest('warehouseId is required for receiving stock');

    const result = await (prisma.$transaction as any)(async (tx: any) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id, organizationId: orgId },
        include: { items: true },
      });
      if (!po) throw AppError.notFound('Purchase order not found');

      for (const received of items) {
        const poItem = (po.items as any[]).find((i: any) => i.id === received.itemId);
        if (!poItem) throw AppError.notFound(`Purchase order item ${received.itemId} not found`);
        if (poItem.receivedQty + received.receivedQty > poItem.quantity) {
          throw AppError.badRequest(`Received quantity exceeds ordered quantity for item ${poItem.id}`);
        }

        await tx.purchaseOrderItem.update({
          where: { id: received.itemId },
          data: { receivedQty: { increment: received.receivedQty } },
        });

        const stockLevel = await tx.stockLevel.upsert({
          where: {
            warehouseId_productId_variantId_binId: {
              warehouseId,
              productId: poItem.productId,
              variantId: poItem.variantId || '',
              binId: '',
            },
          },
          update: { quantity: { increment: received.receivedQty }, available: { increment: received.receivedQty } },
          create: {
            organizationId: orgId, warehouseId, productId: poItem.productId,
            variantId: poItem.variantId || '', quantity: received.receivedQty, available: received.receivedQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId: orgId, type: 'IN', productId: poItem.productId,
            variantId: poItem.variantId || null, stockLevelId: stockLevel.id, warehouseId,
            quantity: received.receivedQty, beforeQty: stockLevel.quantity - received.receivedQty,
            afterQty: stockLevel.quantity, referenceType: 'PURCHASE_ORDER', referenceId: id,
            reference: po.poNumber, createdById: userId,
          },
        });
      }

      const allReceived = po.items.every((item: any) => {
        const updated = items.find(r => r.itemId === item.id);
        return (item.receivedQty + (updated?.receivedQty || 0)) >= item.quantity;
      });

      const anyReceived = items.length > 0;
      const newStatus = allReceived ? 'RECEIVED' as const : anyReceived ? 'PARTIALLY_RECEIVED' as const : po.status;

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus, ...(newStatus === 'RECEIVED' ? { receivedDate: new Date() } : {}) },
        include: poInclude,
      });
    });
    return result;
  },
};
