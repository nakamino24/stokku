"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const soInclude = {
    customer: true,
    items: { include: { product: { select: { name: true, sku: true, unit: true } }, variant: { select: { name: true, sku: true } } } },
    createdBy: { select: { name: true } },
};
exports.SalesOrderService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.status)
            where.status = query.status;
        if (query.customerId)
            where.customerId = query.customerId;
        const [data, total] = await Promise.all([
            database_1.prisma.salesOrder.findMany({ where, include: soInclude, skip: (pagination.page - 1) * pagination.limit, take: pagination.limit, orderBy: { createdAt: 'desc' } }),
            database_1.prisma.salesOrder.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async getById(orgId, id) {
        const so = await database_1.prisma.salesOrder.findFirst({ where: { id, organizationId: orgId }, include: soInclude });
        if (!so)
            throw errors_1.AppError.notFound('Sales order not found');
        return so;
    },
    async create(orgId, userId, data) {
        return database_1.prisma.$transaction(async (tx) => {
            const count = await tx.salesOrder.count({ where: { organizationId: orgId } });
            const soNumber = `SO-${String(count + 1).padStart(5, '0')}-${Date.now().toString(36).toUpperCase()}`;
            for (const item of data.items) {
                const stock = await tx.stockLevel.findFirst({
                    where: { organizationId: orgId, productId: item.productId, variantId: item.variantId || '' },
                });
                if (!stock || stock.available < item.quantity) {
                    const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
                    throw errors_1.AppError.badRequest(`Insufficient stock for ${product?.name || 'product'}`);
                }
            }
            const items = data.items.map((item) => ({
                productId: item.productId, variantId: item.variantId || null,
                quantity: item.quantity, unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
            }));
            const subtotal = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
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
    async updateStatus(orgId, userId, id, status) {
        return database_1.prisma.$transaction(async (tx) => {
            const so = await tx.salesOrder.findFirst({ where: { id, organizationId: orgId } });
            if (!so)
                throw errors_1.AppError.notFound('Sales order not found');
            const validTransitions = {
                DRAFT: ['CONFIRMED', 'CANCELLED'],
                CONFIRMED: ['PICKING', 'CANCELLED'],
                PICKING: ['SHIPPING', 'CANCELLED'],
                SHIPPING: ['DELIVERED', 'CANCELLED'],
                DELIVERED: ['RETURNED'],
            };
            if (!validTransitions[so.status]?.includes(status)) {
                throw errors_1.AppError.badRequest(`Cannot transition from ${so.status} to ${status}`);
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
//# sourceMappingURL=sales-orders.service.js.map