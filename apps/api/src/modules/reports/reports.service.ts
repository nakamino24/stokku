import { prisma } from '@stokku/database';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const ReportsService = {
  async stockValue(orgId: string) {
    const stockLevels = await prisma.stockLevel.findMany({
      where: { organizationId: orgId },
      include: { product: { select: { name: true, costPrice: true, unitPrice: true } }, warehouse: { select: { name: true } } },
    });

    const totalCostValue = stockLevels.reduce((sum, s) => sum + Number(s.product.costPrice) * s.quantity, 0);
    const totalRetailValue = stockLevels.reduce((sum, s) => sum + Number(s.product.unitPrice) * s.quantity, 0);

    return {
      totalCostValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalCostValue,
      items: stockLevels.map(s => ({
        product: s.product.name,
        warehouse: s.warehouse.name,
        quantity: s.quantity,
        costPrice: s.product.costPrice,
        unitPrice: s.product.unitPrice,
        totalCost: Number(s.product.costPrice) * s.quantity,
        totalRetail: Number(s.product.unitPrice) * s.quantity,
      })),
    };
  },

  async stockMovement(orgId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId: orgId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const byType = movements.reduce((acc: Record<string, number>, m) => {
      acc[m.type] = (acc[m.type] || 0) + m.quantity;
      return acc;
    }, {});

    return { total: movements.length, byType, movements };
  },

  async sales(orgId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId: orgId, status: 'DELIVERED' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;

    return { totalOrders, totalRevenue, averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0, orders };
  },

  async purchasing(orgId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId: orgId, status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] } };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { supplier: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { totalOrders: orders.length, totalSpent, orders };
  },

  async inventoryValuation(orgId: string) {
    const products = await prisma.product.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        variants: true,
        stockLevels: { include: { warehouse: { select: { name: true } } } },
      },
    });

    const valuation = products.map(p => {
      const totalQty = p.stockLevels.reduce((sum, s) => sum + s.quantity, 0);
      const avgCost = p.variants.length > 0
        ? p.variants.reduce((sum, v) => sum + Number(v.costPrice), 0) / p.variants.length
        : Number(p.costPrice);
      return {
        product: p.name,
        sku: p.sku,
        totalQuantity: totalQty,
        avgCost,
        totalValue: avgCost * totalQty,
      };
    });

    return {
      totalValue: valuation.reduce((sum, v) => sum + v.totalValue, 0),
      items: valuation,
    };
  },

  async auditLog(orgId: string, query: Record<string, any>) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));

    const where: any = { organizationId: orgId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },
};
