"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const poInclude = {
    supplier: true,
    items: { include: { product: { select: { name: true, sku: true, unit: true } }, variant: { select: { name: true, sku: true } } } },
    createdBy: { select: { name: true } },
};
exports.PurchaseOrderService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.status)
            where.status = query.status;
        if (query.supplierId)
            where.supplierId = query.supplierId;
        const [data, total] = await Promise.all([
            database_1.prisma.purchaseOrder.findMany({ where, include: poInclude, skip: (pagination.page - 1) * pagination.limit, take: pagination.limit, orderBy: { createdAt: 'desc' } }),
            database_1.prisma.purchaseOrder.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async getById(orgId, id) {
        const po = await database_1.prisma.purchaseOrder.findFirst({ where: { id, organizationId: orgId }, include: poInclude });
        if (!po)
            throw errors_1.AppError.notFound('Purchase order not found');
        return po;
    },
    async create(orgId, userId, data) {
        const count = await database_1.prisma.purchaseOrder.count({ where: { organizationId: orgId } });
        const poNumber = `PO-${String(count + 1).padStart(5, '0')}-${Date.now().toString(36).toUpperCase()}`;
        const items = data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
        }));
        const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const taxAmount = subtotal * (data.taxRate || 0);
        const totalAmount = subtotal + taxAmount;
        const po = await database_1.prisma.purchaseOrder.create({
            data: {
                organizationId: orgId, poNumber, supplierId: data.supplierId,
                expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
                notes: data.notes, subtotal, taxAmount, totalAmount, createdById: userId,
                items: { create: items },
            },
            include: poInclude,
        });
        await database_1.prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'PurchaseOrder', entityId: po.id } });
        return po;
    },
    async updateStatus(orgId, userId, id, status) {
        const po = await database_1.prisma.purchaseOrder.findFirst({ where: { id, organizationId: orgId } });
        if (!po)
            throw errors_1.AppError.notFound('Purchase order not found');
        const validTransitions = {
            DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
            PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
            APPROVED: ['SENT', 'CANCELLED'],
            SENT: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
            PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
        };
        if (!validTransitions[po.status]?.includes(status)) {
            throw errors_1.AppError.badRequest(`Cannot transition from ${po.status} to ${status}`);
        }
        const updateData = { status };
        if (status === 'RECEIVED')
            updateData.receivedDate = new Date();
        const updated = await database_1.prisma.purchaseOrder.update({ where: { id }, data: updateData, include: poInclude });
        await database_1.prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'PurchaseOrder', entityId: id } });
        return updated;
    },
    async receive(orgId, userId, warehouseId, id, items) {
        if (!warehouseId)
            throw errors_1.AppError.badRequest('warehouseId is required for receiving stock');
        const result = await database_1.prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findFirst({
                where: { id, organizationId: orgId },
                include: { items: true },
            });
            if (!po)
                throw errors_1.AppError.notFound('Purchase order not found');
            for (const received of items) {
                const poItem = po.items.find((i) => i.id === received.itemId);
                if (!poItem)
                    throw errors_1.AppError.notFound(`Purchase order item ${received.itemId} not found`);
                if (poItem.receivedQty + received.receivedQty > poItem.quantity) {
                    throw errors_1.AppError.badRequest(`Received quantity exceeds ordered quantity for item ${poItem.id}`);
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
            const allReceived = po.items.every((item) => {
                const updated = items.find(r => r.itemId === item.id);
                return (item.receivedQty + (updated?.receivedQty || 0)) >= item.quantity;
            });
            const anyReceived = items.length > 0;
            const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status;
            return tx.purchaseOrder.update({
                where: { id },
                data: { status: newStatus, ...(newStatus === 'RECEIVED' ? { receivedDate: new Date() } : {}) },
                include: poInclude,
            });
        });
        return result;
    },
};
//# sourceMappingURL=purchase-orders.service.js.map