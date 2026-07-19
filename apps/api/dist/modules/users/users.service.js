"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
exports.UsersService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, avatarUrl: true },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
                orderBy: { [pagination.sortBy]: pagination.sortOrder },
            }),
            database_1.prisma.user.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async updateRole(orgId, userId, role) {
        const user = await database_1.prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
        if (!user)
            throw errors_1.AppError.notFound('User not found');
        return database_1.prisma.user.update({
            where: { id: userId },
            data: { role: role },
            select: { id: true, name: true, email: true, role: true },
        });
    },
    async deactivate(orgId, userId) {
        const user = await database_1.prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
        if (!user)
            throw errors_1.AppError.notFound('User not found');
        return database_1.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    },
};
//# sourceMappingURL=users.service.js.map