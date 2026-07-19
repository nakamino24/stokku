"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
exports.SupplierService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { contactPerson: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            database_1.prisma.supplier.findMany({
                where,
                include: { _count: { select: { products: true, purchaseOrders: true } } },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
                orderBy: { [pagination.sortBy]: pagination.sortOrder },
            }),
            database_1.prisma.supplier.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async getById(orgId, id) {
        const supplier = await database_1.prisma.supplier.findFirst({
            where: { id, organizationId: orgId },
            include: {
                products: { include: { product: { include: { category: true } } } },
                purchaseOrders: { take: 20, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!supplier)
            throw errors_1.AppError.notFound('Supplier not found');
        return supplier;
    },
    async create(orgId, data) {
        return database_1.prisma.supplier.create({ data: { ...data, organizationId: orgId } });
    },
    async update(orgId, id, data) {
        const supplier = await database_1.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
        if (!supplier)
            throw errors_1.AppError.notFound('Supplier not found');
        return database_1.prisma.supplier.update({ where: { id }, data });
    },
    async delete(orgId, id) {
        const supplier = await database_1.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
        if (!supplier)
            throw errors_1.AppError.notFound('Supplier not found');
        await database_1.prisma.supplier.update({ where: { id }, data: { status: 'INACTIVE' } });
    },
};
//# sourceMappingURL=suppliers.service.js.map