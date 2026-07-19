"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
exports.RolesService = {
    async list(orgId) {
        return database_1.prisma.role.findMany({
            where: { organizationId: orgId },
            include: { permissions: true },
            orderBy: { name: 'asc' },
        });
    },
    async create(orgId, data) {
        const existing = await database_1.prisma.role.findFirst({ where: { organizationId: orgId, slug: data.slug } });
        if (existing)
            throw errors_1.AppError.conflict('Role slug already exists');
        return database_1.prisma.role.create({
            data: {
                organizationId: orgId,
                name: data.name,
                slug: data.slug,
                description: data.description,
                permissions: {
                    create: data.permissions.map(p => ({ permission: p })),
                },
            },
            include: { permissions: true },
        });
    },
    async update(orgId, id, data) {
        const role = await database_1.prisma.role.findFirst({ where: { id, organizationId: orgId } });
        if (!role)
            throw errors_1.AppError.notFound('Role not found');
        if (data.permissions) {
            await database_1.prisma.rolePermission.deleteMany({ where: { roleId: id } });
            await database_1.prisma.rolePermission.createMany({
                data: data.permissions.map(p => ({ roleId: id, permission: p })),
            });
        }
        return database_1.prisma.role.update({
            where: { id },
            data: { name: data.name, description: data.description },
            include: { permissions: true },
        });
    },
    async delete(orgId, id) {
        const role = await database_1.prisma.role.findFirst({ where: { id, organizationId: orgId } });
        if (!role)
            throw errors_1.AppError.notFound('Role not found');
        if (role.isSystem)
            throw errors_1.AppError.badRequest('Cannot delete system role');
        await database_1.prisma.role.delete({ where: { id } });
    },
};
//# sourceMappingURL=roles.service.js.map