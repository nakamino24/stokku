import { Prisma, prisma } from '@stokku/database';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const ReportsService = {
  async stockValue(orgId: string) {
    const stockLevels = await prisma.stockLevel.findMany({
      where: { organizationId: orgId },
      include: { product: { select: { name: true, costPrice: true, unitPrice: true } }, warehouse: { select: { name: true } } },
    });

    const totalCostValue = stockLevels.reduce(
      (sum, stock) => sum.plus(stock.product.costPrice.times(stock.onHand)),
      new Prisma.Decimal(0),
    );
    const totalRetailValue = stockLevels.reduce(
      (sum, stock) => sum.plus(stock.product.unitPrice.times(stock.onHand)),
      new Prisma.Decimal(0),
    );

    return {
      totalCostValue: totalCostValue.toString(),
      totalRetailValue: totalRetailValue.toString(),
      potentialProfit: totalRetailValue.minus(totalCostValue).toString(),
      items: stockLevels.map(s => ({
        product: s.product.name,
        warehouse: s.warehouse.name,
        quantity: s.onHand,
        costPrice: s.product.costPrice,
        unitPrice: s.product.unitPrice,
        totalCost: s.product.costPrice.times(s.onHand).toString(),
        totalRetail: s.product.unitPrice.times(s.onHand).toString(),
      })),
    };
  },

  async stockMovement(orgId: string, startDate?: string, endDate?: string) {
    const where: Prisma.StockMovementWhereInput = { organizationId: orgId };
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

    const byType = movements.reduce((acc: Record<string, Prisma.Decimal>, m) => {
      acc[m.type] = (acc[m.type] ?? new Prisma.Decimal(0)).plus(m.onHandDelta);
      return acc;
    }, {});

    return {
      total: movements.length,
      byType: Object.fromEntries(Object.entries(byType).map(([type, quantity]) => [type, quantity.toString()])),
      movements,
    };
  },

  async sales(orgId: string, startDate?: string, endDate?: string) {
    const where: Prisma.SalesOrderWhereInput = { organizationId: orgId, status: 'DELIVERED' };
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

    const totalRevenue = orders.reduce((sum, order) => sum.plus(order.totalAmount), new Prisma.Decimal(0));
    const totalOrders = orders.length;

    return {
      totalOrders,
      totalRevenue: totalRevenue.toString(),
      averageOrderValue: totalOrders > 0 ? totalRevenue.dividedBy(totalOrders).toString() : '0',
      orders,
    };
  },

  async purchasing(orgId: string, startDate?: string, endDate?: string) {
    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId: orgId,
      status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
    };
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

    const totalSpent = orders.reduce((sum, order) => sum.plus(order.totalAmount), new Prisma.Decimal(0));
    return { totalOrders: orders.length, totalSpent: totalSpent.toString(), orders };
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
      const totalQty = p.stockLevels.reduce((sum, stock) => sum.plus(stock.onHand), new Prisma.Decimal(0));
      const avgCost = p.variants.length > 0
        ? p.variants.reduce((sum, variant) => sum.plus(variant.costPrice), new Prisma.Decimal(0)).dividedBy(p.variants.length)
        : p.costPrice;
      return {
        product: p.name,
        sku: p.sku,
        totalQuantity: totalQty,
        avgCost,
        totalValue: avgCost.times(totalQty),
      };
    });

    return {
      totalValue: valuation.reduce((sum, item) => sum.plus(item.totalValue), new Prisma.Decimal(0)).toString(),
      items: valuation,
    };
  },

  async auditLog(orgId: string, query: Record<string, unknown>) {
    const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '50'), 10) || 50));

    const where: Prisma.AuditLogWhereInput = { organizationId: orgId };
    if (typeof query.entityType === 'string') where.entityType = query.entityType;
    if (typeof query.action === 'string') where.action = query.action;

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
