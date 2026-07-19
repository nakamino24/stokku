"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_1 = require("@stokku/database");
exports.DashboardService = {
    async getSummary(orgId) {
        const [productCount, supplierCount, customerCount, warehouseCount, totalStock, pendingPO, pendingSO] = await Promise.all([
            database_1.prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
            database_1.prisma.supplier.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
            database_1.prisma.customer.count({ where: { organizationId: orgId, isActive: true } }),
            database_1.prisma.warehouse.count({ where: { organizationId: orgId, isActive: true } }),
            database_1.prisma.stockLevel.aggregate({ where: { organizationId: orgId }, _sum: { quantity: true } }),
            database_1.prisma.purchaseOrder.count({ where: { organizationId: orgId, status: { in: ['PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'] } } }),
            database_1.prisma.salesOrder.count({ where: { organizationId: orgId, status: { in: ['CONFIRMED', 'PICKING', 'SHIPPING'] } } }),
        ]);
        const lowStockCount = await database_1.prisma.stockLevel.count({
            where: {
                organizationId: orgId,
                reorderPoint: { not: null },
                quantity: { lte: database_1.prisma.stockLevel.fields.reorderPoint },
            },
        });
        const recentMovements = await database_1.prisma.stockMovement.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                product: { select: { name: true } },
                warehouse: { select: { name: true } },
                createdBy: { select: { name: true } },
            },
        });
        return {
            stats: {
                products: productCount,
                suppliers: supplierCount,
                customers: customerCount,
                warehouses: warehouseCount,
                totalStock: totalStock._sum.quantity || 0,
                pendingPO,
                pendingSO,
                lowStockAlerts: lowStockCount,
            },
            recentMovements,
        };
    },
    async getLowStockAlerts(orgId) {
        return database_1.prisma.stockLevel.findMany({
            where: {
                organizationId: orgId,
                reorderPoint: { not: null },
                quantity: { lte: database_1.prisma.stockLevel.fields.reorderPoint },
            },
            include: {
                product: { select: { name: true, sku: true, unit: true } },
                warehouse: { select: { name: true } },
            },
            orderBy: { quantity: 'asc' },
        });
    },
};
//# sourceMappingURL=dashboard.service.js.map