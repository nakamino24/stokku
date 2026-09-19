import { PurchaseOrderStatus, prisma } from '@stokku/database';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

const PENDING_PURCHASE_STATUSES: PurchaseOrderStatus[] = [
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',
  'PARTIALLY_RECEIVED',
];

export const DashboardService = {
  async getSummary(orgId: string, userId: string) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const stockScope = warehouseIdFilter(scope);
    const [productCount, supplierCount, customerCount, warehouseCount, totalStock, pendingPO, pendingSO] = await Promise.all([
      prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.supplier.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.warehouse.count({ where: { organizationId: orgId, isActive: true, ...(stockScope ? { id: stockScope } : {}) } }),
      prisma.stockLevel.aggregate({ where: { organizationId: orgId, ...(stockScope ? { warehouseId: stockScope } : {}) }, _sum: { onHand: true } }),
      prisma.purchaseOrder.count({
        where: {
          organizationId: orgId,
          status: { in: PENDING_PURCHASE_STATUSES },
          ...(stockScope ? { goodsReceipts: { some: { warehouseId: stockScope } } } : {}),
        },
      }),
      prisma.salesOrder.count({
        where: {
          organizationId: orgId,
          status: { in: ['CONFIRMED', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED'] },
          ...(stockScope ? { items: { some: { allocations: { some: { stockLevel: { warehouseId: stockScope } } } } } } : {}),
        },
      }),
    ]);

    const lowStockCount = await prisma.stockLevel.count({
      where: {
        organizationId: orgId,
        ...(stockScope ? { warehouseId: stockScope } : {}),
        reorderPoint: { not: null },
        available: { lte: prisma.stockLevel.fields.reorderPoint },
      },
    });

    const recentMovements = await prisma.stockMovement.findMany({
      where: { organizationId: orgId, ...(stockScope ? { warehouseId: stockScope } : {}) },
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
        totalStock: totalStock._sum.onHand || 0,
        pendingPO,
        pendingSO,
        lowStockAlerts: lowStockCount,
      },
      recentMovements,
    };
  },

  async getLowStockAlerts(orgId: string, userId: string) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const stockScope = warehouseIdFilter(scope);
    return prisma.stockLevel.findMany({
      where: {
        organizationId: orgId,
        ...(stockScope ? { warehouseId: stockScope } : {}),
        reorderPoint: { not: null },
        available: { lte: prisma.stockLevel.fields.reorderPoint },
      },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { available: 'asc' },
    });
  },
};
