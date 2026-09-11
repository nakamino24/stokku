import { Prisma, PurchaseOrderStatus, prisma } from '@stokku/database';
import { DocumentSequenceService } from '../inventory/document-sequence.service';
import {
  DecimalInput,
  InventoryPostingService,
  withInventoryTransaction,
} from '../inventory/inventory-posting.service';
import { validateInventoryIdentity } from '../inventory/inventory-validation';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

interface PurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  taxRate?: DecimalInput;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: DecimalInput;
    unitPrice: DecimalInput;
  }>;
}

interface GoodsReceiptInput {
  warehouseId: string;
  binId?: string | null;
  supplierDeliveryReference?: string;
  idempotencyKey: string;
  items: Array<{
    itemId: string;
    receivedQty: DecimalInput;
    acceptedQty?: DecimalInput;
    rejectedQty?: DecimalInput;
  }>;
}

const poInclude = {
  supplier: true,
  items: {
    include: {
      product: { select: { name: true, sku: true, unit: true } },
      variant: { select: { name: true, sku: true } },
      receiptLines: { include: { goodsReceipt: { select: { receiptNumber: true, receivedAt: true } } } },
    },
  },
  goodsReceipts: { orderBy: { receivedAt: 'desc' as const }, include: { lines: true } },
  createdBy: { select: { name: true } },
} satisfies Prisma.PurchaseOrderInclude;

const poListSelect = {
  id: true,
  poNumber: true,
  status: true,
  orderDate: true,
  expectedDate: true,
  totalAmount: true,
  supplier: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.PurchaseOrderSelect;

export const PurchaseOrderService = {
  async list(orgId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const where: Prisma.PurchaseOrderWhereInput = { organizationId: orgId };
    if (typeof query.status === 'string') where.status = query.status as PurchaseOrderStatus;
    if (typeof query.supplierId === 'string') where.supplierId = query.supplierId;

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        select: poListSelect,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: poInclude,
    });
    if (!order) throw AppError.notFound('Purchase order not found');
    return order;
  },

  async create(orgId: string, userId: string, data: PurchaseOrderInput) {
    return withInventoryTransaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: data.supplierId, organizationId: orgId, status: 'ACTIVE' },
      });
      if (!supplier) throw AppError.notFound('Supplier not found');

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
      const taxAmount = subtotal.times(new Prisma.Decimal(data.taxRate ?? 0));
      const poNumber = await DocumentSequenceService.next(tx, orgId, 'PURCHASE_ORDER');
      const order = await tx.purchaseOrder.create({
        data: {
          organizationId: orgId,
          poNumber,
          supplierId: data.supplierId,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes,
          subtotal,
          taxAmount,
          totalAmount: subtotal.plus(taxAmount),
          createdById: userId,
          items: { create: items },
        },
        include: poInclude,
      });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'CREATE',
          entityType: 'PurchaseOrder',
          entityId: order.id,
          newValues: JSON.stringify({ poNumber, status: 'DRAFT' }),
        },
      });
      return order;
    });
  },

  async updateStatus(orgId: string, userId: string, id: string, status: PurchaseOrderStatus) {
    if (status === 'PARTIALLY_RECEIVED' || status === 'RECEIVED') {
      throw AppError.badRequest('Receiving status is derived from posted goods receipts');
    }

    return withInventoryTransaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({ where: { id, organizationId: orgId } });
      if (!order) throw AppError.notFound('Purchase order not found');
      if (order.status === status) return order;

      const validTransitions: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus[]>> = {
        DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
        PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
        APPROVED: ['SENT', 'CANCELLED'],
        SENT: ['CANCELLED'],
      };
      if (!validTransitions[order.status]?.includes(status)) {
        throw AppError.badRequest(`Cannot transition from ${order.status} to ${status}`);
      }

      const updated = await tx.purchaseOrder.update({ where: { id }, data: { status }, include: poInclude });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'STATUS_CHANGE',
          entityType: 'PurchaseOrder',
          entityId: id,
          oldValues: JSON.stringify({ status: order.status }),
          newValues: JSON.stringify({ status }),
        },
      });
      return updated;
    });
  },

  async receive(orgId: string, userId: string, id: string, data: GoodsReceiptInput) {
    return withInventoryTransaction(async (tx) => {
      const duplicate = await tx.goodsReceipt.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: orgId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: { lines: true, purchaseOrder: true },
      });
      if (duplicate) return duplicate;

      const order = await tx.purchaseOrder.findFirst({
        where: { id, organizationId: orgId },
        include: { items: true },
      });
      if (!order) throw AppError.notFound('Purchase order not found');
      if (order.status !== 'SENT' && order.status !== 'PARTIALLY_RECEIVED') {
        throw AppError.badRequest(`Cannot receive a purchase order in ${order.status} status`);
      }

      const warehouse = await tx.warehouse.findFirst({
        where: { id: data.warehouseId, organizationId: orgId, isActive: true },
      });
      if (!warehouse) throw AppError.notFound('Warehouse not found');
      if (data.binId) {
        const bin = await tx.warehouseBin.findFirst({
          where: {
            id: data.binId,
            zone: { warehouseId: data.warehouseId, warehouse: { organizationId: orgId } },
          },
        });
        if (!bin) throw AppError.notFound('Warehouse bin not found');
      }

      const receiptNumber = await DocumentSequenceService.next(tx, orgId, 'GOODS_RECEIPT');
      const receipt = await tx.goodsReceipt.create({
        data: {
          organizationId: orgId,
          receiptNumber,
          purchaseOrderId: id,
          warehouseId: data.warehouseId,
          binId: data.binId ?? null,
          supplierDeliveryReference: data.supplierDeliveryReference,
          idempotencyKey: data.idempotencyKey,
          receivedById: userId,
        },
      });

      const seenItemIds = new Set<string>();
      for (const input of data.items) {
        if (seenItemIds.has(input.itemId)) {
          throw AppError.badRequest('Each purchase order item may appear only once per receipt');
        }
        seenItemIds.add(input.itemId);
        const orderItem = order.items.find((item) => item.id === input.itemId);
        if (!orderItem) throw AppError.notFound(`Purchase order item ${input.itemId} not found`);

        const receivedQty = new Prisma.Decimal(input.receivedQty);
        const rejectedQty = new Prisma.Decimal(input.rejectedQty ?? 0);
        const acceptedQty = input.acceptedQty === undefined
          ? receivedQty.minus(rejectedQty)
          : new Prisma.Decimal(input.acceptedQty);
        if (receivedQty.lessThanOrEqualTo(0) || acceptedQty.isNegative() || rejectedQty.isNegative()) {
          throw AppError.badRequest('Receipt quantities are invalid');
        }
        if (!acceptedQty.plus(rejectedQty).equals(receivedQty)) {
          throw AppError.badRequest('acceptedQty plus rejectedQty must equal receivedQty');
        }
        if (new Prisma.Decimal(orderItem.receivedQty).plus(acceptedQty).greaterThan(orderItem.quantity)) {
          throw AppError.badRequest(`Accepted quantity exceeds ordered quantity for item ${orderItem.id}`);
        }

        await validateInventoryIdentity(tx, {
          organizationId: orgId,
          productId: orderItem.productId,
          variantId: orderItem.variantId,
          warehouseId: data.warehouseId,
          binId: data.binId,
        });
        const receiptLine = await tx.goodsReceiptLine.create({
          data: {
            goodsReceiptId: receipt.id,
            purchaseOrderItemId: orderItem.id,
            productId: orderItem.productId,
            variantId: orderItem.variantId,
            expectedQty: new Prisma.Decimal(orderItem.quantity).minus(orderItem.receivedQty),
            receivedQty,
            acceptedQty,
            rejectedQty,
          },
        });

        if (acceptedQty.greaterThan(0)) {
          const balance = await InventoryPostingService.ensureBalance(tx, {
            organizationId: orgId,
            warehouseId: data.warehouseId,
            binId: data.binId,
            productId: orderItem.productId,
            variantId: orderItem.variantId,
          });
          await InventoryPostingService.receive(tx, {
            organizationId: orgId,
            userId,
            balanceId: balance.id,
            quantity: acceptedQty,
            unitPrice: orderItem.unitPrice,
            sourceDocumentType: 'GOODS_RECEIPT',
            sourceDocumentId: receipt.id,
            reference: receiptNumber,
            idempotencyKey: `GR:${receipt.id}:LINE:${receiptLine.id}`,
            correlationId: `GR:${receipt.id}`,
          });
          await tx.purchaseOrderItem.update({
            where: { id: orderItem.id },
            data: { receivedQty: { increment: acceptedQty } },
          });
        }
      }

      const currentItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const allReceived = currentItems.every((item) => item.receivedQty.greaterThanOrEqualTo(item.quantity));
      const anyReceived = currentItems.some((item) => item.receivedQty.greaterThan(0));
      const status: PurchaseOrderStatus = allReceived
        ? 'RECEIVED'
        : anyReceived
          ? 'PARTIALLY_RECEIVED'
          : order.status;

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          receivedDate: allReceived ? new Date() : null,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: 'GOODS_RECEIPT_POSTED',
          entityType: 'GoodsReceipt',
          entityId: receipt.id,
          newValues: JSON.stringify({ receiptNumber, purchaseOrderId: id, status }),
        },
      });

      return tx.goodsReceipt.findUniqueOrThrow({
        where: { id: receipt.id },
        include: { lines: true, purchaseOrder: { include: poInclude } },
      });
    });
  },
};
