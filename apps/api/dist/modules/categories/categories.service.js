"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
exports.CategoryService = {
    async list(orgId) {
        return database_1.prisma.category.findMany({
            where: { organizationId: orgId },
            include: { children: { include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
            orderBy: { sortOrder: 'asc' },
        });
    },
    async getById(orgId, id) {
        const category = await database_1.prisma.category.findFirst({
            where: { id, organizationId: orgId },
            include: { children: true, parent: true, _count: { select: { products: true } } },
        });
        if (!category)
            throw errors_1.AppError.notFound('Category not found');
        return category;
    },
    async create(orgId, data) {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
        const existing = await database_1.prisma.category.findFirst({ where: { organizationId: orgId, slug } });
        if (existing)
            throw errors_1.AppError.conflict('Category slug already exists');
        return database_1.prisma.category.create({
            data: { ...data, slug, organizationId: orgId },
        });
    },
    async update(orgId, id, data) {
        const category = await database_1.prisma.category.findFirst({ where: { id, organizationId: orgId } });
        if (!category)
            throw errors_1.AppError.notFound('Category not found');
        if (data.slug) {
            const existing = await database_1.prisma.category.findFirst({ where: { organizationId: orgId, slug: data.slug, id: { not: id } } });
            if (existing)
                throw errors_1.AppError.conflict('Category slug already exists');
        }
        return database_1.prisma.category.update({ where: { id }, data });
    },
    async delete(orgId, id) {
        const category = await database_1.prisma.category.findFirst({ where: { id, organizationId: orgId }, include: { _count: { select: { products: true } } } });
        if (!category)
            throw errors_1.AppError.notFound('Category not found');
        if (category._count.products > 0)
            throw errors_1.AppError.badRequest('Cannot delete category with existing products');
        await database_1.prisma.category.delete({ where: { id } });
    },
};
//# sourceMappingURL=categories.service.js.map