"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
exports.WarehouseService = {
    async list(orgId) {
        return database_1.prisma.warehouse.findMany({
            where: { organizationId: orgId, isActive: true },
            include: {
                zones: { include: { bins: true } },
                _count: { select: { stockLevels: true } },
            },
            orderBy: { name: 'asc' },
        });
    },
    async getById(orgId, id) {
        const warehouse = await database_1.prisma.warehouse.findFirst({
            where: { id, organizationId: orgId },
            include: {
                zones: { include: { bins: true } },
                stockLevels: {
                    include: { product: { select: { name: true, sku: true } }, variant: { select: { name: true, sku: true } } },
                    orderBy: { quantity: 'desc' },
                    take: 100,
                },
            },
        });
        if (!warehouse)
            throw errors_1.AppError.notFound('Warehouse not found');
        return warehouse;
    },
    async create(orgId, data) {
        const existing = await database_1.prisma.warehouse.findFirst({ where: { organizationId: orgId, code: data.code } });
        if (existing)
            throw errors_1.AppError.conflict('Warehouse code already exists');
        return database_1.prisma.warehouse.create({ data: { ...data, organizationId: orgId } });
    },
    async update(orgId, id, data) {
        const warehouse = await database_1.prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
        if (!warehouse)
            throw errors_1.AppError.notFound('Warehouse not found');
        return database_1.prisma.warehouse.update({ where: { id }, data });
    },
    async delete(orgId, id) {
        const warehouse = await database_1.prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
        if (!warehouse)
            throw errors_1.AppError.notFound('Warehouse not found');
        await database_1.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
    },
    async createZone(orgId, warehouseId, data) {
        const warehouse = await database_1.prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: orgId } });
        if (!warehouse)
            throw errors_1.AppError.notFound('Warehouse not found');
        return database_1.prisma.warehouseZone.create({ data: { ...data, warehouseId } });
    },
    async createBin(orgId, zoneId, data) {
        const zone = await database_1.prisma.warehouseZone.findFirst({ where: { id: zoneId, warehouse: { organizationId: orgId } } });
        if (!zone)
            throw errors_1.AppError.notFound('Zone not found');
        return database_1.prisma.warehouseBin.create({ data: { ...data, zoneId } });
    },
};
//# sourceMappingURL=warehouses.service.js.map