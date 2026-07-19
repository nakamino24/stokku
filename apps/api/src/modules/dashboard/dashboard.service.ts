import { prisma } from '@stokku/database';

export const DashboardService = {
  async getSummary(orgId: string) {
    const [productCount, supplierCount, customerCount, warehouseCount, totalStock, pendingPO, pendingSO] = await Promise.all([
      prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.supplier.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.warehouse.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.stockLevel.aggregate({ where: { organizationId: orgId }, _sum: { quantity: true } }),
      prisma.purchaseOrder.count({ where: { organizationId: orgId, status: { in: ['PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'] as any } } }),
      prisma.salesOrder.count({ where: { organizationId: orgId, status: { in: ['CONFIRMED', 'PICKING', 'SHIPPING'] as any } } }),
    ]);

    const lowStockCount = await prisma.stockLevel.count({
      where: {
        organizationId: orgId,
        reorderPoint: { not: null },
        quantity: { lte: prisma.stockLevel.fields.reorderPoint },
      },
    });

    const recentMovements = await prisma.stockMovement.findMany({
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

  async getLowStockAlerts(orgId: string) {
    return prisma.stockLevel.findMany({
      where: {
        organizationId: orgId,
        reorderPoint: { not: null },
        quantity: { lte: prisma.stockLevel.fields.reorderPoint },
      },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { quantity: 'asc' },
    });
  },
};
