"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
exports.CustomerService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            database_1.prisma.customer.findMany({
                where,
                include: { _count: { select: { salesOrders: true } } },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
                orderBy: { [pagination.sortBy]: pagination.sortOrder },
            }),
            database_1.prisma.customer.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async getById(orgId, id) {
        const customer = await database_1.prisma.customer.findFirst({
            where: { id, organizationId: orgId },
            include: { salesOrders: { take: 20, orderBy: { createdAt: 'desc' } } },
        });
        if (!customer)
            throw errors_1.AppError.notFound('Customer not found');
        return customer;
    },
    async create(orgId, data) {
        return database_1.prisma.customer.create({ data: { ...data, organizationId: orgId } });
    },
    async update(orgId, id, data) {
        const customer = await database_1.prisma.customer.findFirst({ where: { id, organizationId: orgId } });
        if (!customer)
            throw errors_1.AppError.notFound('Customer not found');
        return database_1.prisma.customer.update({ where: { id }, data });
    },
    async delete(orgId, id) {
        const customer = await database_1.prisma.customer.findFirst({ where: { id, organizationId: orgId } });
        if (!customer)
            throw errors_1.AppError.notFound('Customer not found');
        await database_1.prisma.customer.update({ where: { id }, data: { isActive: false } });
    },
};
//# sourceMappingURL=customers.service.js.map