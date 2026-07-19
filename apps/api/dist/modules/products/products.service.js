"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
const pagination_1 = require("../../utils/pagination");
const productInclude = {
    category: true,
    variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    suppliers: { include: { supplier: true } },
    _count: { select: { stockLevels: true, movements: true } },
};
exports.ProductService = {
    async list(orgId, query) {
        const pagination = (0, pagination_1.parsePagination)(query);
        const where = { organizationId: orgId };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
                { barcode: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.status)
            where.status = query.status;
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        const [data, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                include: productInclude,
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
                orderBy: { [pagination.sortBy]: pagination.sortOrder },
            }),
            database_1.prisma.product.count({ where }),
        ]);
        return (0, pagination_1.paginatedResult)(data, total, pagination);
    },
    async getById(orgId, id) {
        const product = await database_1.prisma.product.findFirst({
            where: { id, organizationId: orgId },
            include: {
                ...productInclude,
                stockLevels: { include: { warehouse: true } },
                movements: { take: 50, orderBy: { createdAt: 'desc' }, include: { warehouse: true, createdBy: { select: { name: true } } } },
            },
        });
        if (!product)
            throw errors_1.AppError.notFound('Product not found');
        return product;
    },
    async create(orgId, userId, data) {
        const existing = data.sku ? await database_1.prisma.product.findFirst({ where: { organizationId: orgId, sku: data.sku } }) : null;
        if (existing)
            throw errors_1.AppError.conflict('Product SKU already exists');
        const { variants, supplierIds, ...productData } = data;
        const product = await database_1.prisma.product.create({
            data: {
                ...productData,
                organizationId: orgId,
                variants: variants?.length ? {
                    create: variants.map((v) => ({
                        ...v,
                        options: v.options ? JSON.stringify(v.options) : '{}',
                    })),
                } : undefined,
                suppliers: supplierIds?.length ? {
                    create: supplierIds.map((supplierId) => ({ supplierId })),
                } : undefined,
            },
            include: productInclude,
        });
        await database_1.prisma.auditLog.create({
            data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'Product', entityId: product.id },
        });
        return product;
    },
    async update(orgId, userId, id, data) {
        const product = await database_1.prisma.product.findFirst({ where: { id, organizationId: orgId } });
        if (!product)
            throw errors_1.AppError.notFound('Product not found');
        const { variants, supplierIds, ...productData } = data;
        const updated = await database_1.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                ...(variants ? {
                    variants: {
                        deleteMany: {},
                        create: variants.map((v) => ({
                            ...v,
                            options: v.options ? JSON.stringify(v.options) : '{}',
                        })),
                    },
                } : {}),
                ...(supplierIds ? {
                    suppliers: {
                        deleteMany: {},
                        create: supplierIds.map((supplierId) => ({ supplierId })),
                    },
                } : {}),
            },
            include: productInclude,
        });
        await database_1.prisma.auditLog.create({
            data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'Product', entityId: id },
        });
        return updated;
    },
    async delete(orgId, userId, id) {
        const product = await database_1.prisma.product.findFirst({ where: { id, organizationId: orgId } });
        if (!product)
            throw errors_1.AppError.notFound('Product not found');
        await database_1.prisma.product.update({ where: { id }, data: { isActive: false, status: 'DISCONTINUED' } });
        await database_1.prisma.auditLog.create({
            data: { organizationId: orgId, userId, action: 'DELETE', entityType: 'Product', entityId: id },
        });
    },
};
//# sourceMappingURL=products.service.js.map