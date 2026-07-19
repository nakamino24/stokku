import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const StockService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.StockLevelWhereInput = { organizationId: orgId };

    if (query.search) {
      where.product = { name: { contains: query.search, mode: 'insensitive' } };
    }
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.lowStock === 'true') {
      where.reorderPoint = { not: null };
      where.quantity = { lte: prisma.stockLevel.fields.reorderPoint };
    }

    const [data, total] = await Promise.all([
      prisma.stockLevel.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          variant: { select: { name: true, sku: true } },
          warehouse: { select: { name: true, code: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.stockLevel.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async getMovements(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.StockMovementWhereInput = { organizationId: orgId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          variant: { select: { name: true } },
          warehouse: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        skip: (pagination.page - 1) * pagination.limit, take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return paginatedResult(data, total, pagination);
  },

  async adjust(orgId: string, userId: string, data: { productId: string; variantId?: string; warehouseId: string; quantity: number; reason?: string; note?: string }) {
    if (data.quantity === 0) throw AppError.badRequest('Quantity must be non-zero');

    return (prisma.$transaction as any)(async (tx: any) => {
      const product = await tx.product.findFirst({ where: { id: data.productId, organizationId: orgId } });
      if (!product) throw AppError.notFound('Product not found');

      const warehouse = await tx.warehouse.findFirst({ where: { id: data.warehouseId, organizationId: orgId } });
      if (!warehouse) throw AppError.notFound('Warehouse not found');

      const stockLevel = await tx.stockLevel.upsert({
        where: {
          warehouseId_productId_variantId_binId: {
            warehouseId: data.warehouseId, productId: data.productId,
            variantId: data.variantId || '', binId: '',
          },
        },
        update: { quantity: { increment: data.quantity }, available: { increment: data.quantity } },
        create: {
          organizationId: orgId, warehouseId: data.warehouseId, productId: data.productId,
          variantId: data.variantId || '', quantity: data.quantity, available: data.quantity,
        },
      });

      const beforeQty = stockLevel.quantity - data.quantity;
      await tx.stockMovement.create({
        data: {
          organizationId: orgId, type: data.quantity > 0 ? 'IN' : 'OUT', productId: data.productId,
          variantId: data.variantId || null, warehouseId: data.warehouseId,
          stockLevelId: stockLevel.id, quantity: data.quantity, beforeQty, afterQty: stockLevel.quantity,
          reason: data.reason, note: data.note, createdById: userId,
        },
      });

      return stockLevel;
    });
  },

  async transfer(orgId: string, userId: string, data: { productId: string; variantId?: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; note?: string }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw AppError.badRequest('Source and destination warehouses must be different');
    }
    if (data.quantity <= 0) throw AppError.badRequest('Transfer quantity must be positive');

    return (prisma.$transaction as any)(async (tx: any) => {
      const fromStock = await tx.stockLevel.findFirst({
        where: { organizationId: orgId, warehouseId: data.fromWarehouseId, productId: data.productId, variantId: data.variantId || '' },
      });
      if (!fromStock || fromStock.available < data.quantity) {
        throw AppError.badRequest('Insufficient stock in source warehouse');
      }

      await tx.stockLevel.update({
        where: { id: fromStock.id },
        data: { quantity: { decrement: data.quantity }, available: { decrement: data.quantity } },
      });

      const toStock = await tx.stockLevel.upsert({
        where: {
          warehouseId_productId_variantId_binId: {
            warehouseId: data.toWarehouseId, productId: data.productId,
            variantId: data.variantId || '', binId: '',
          },
        },
        update: { quantity: { increment: data.quantity }, available: { increment: data.quantity } },
        create: {
          organizationId: orgId, warehouseId: data.toWarehouseId, productId: data.productId,
          variantId: data.variantId || '', quantity: data.quantity, available: data.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: orgId, type: 'TRANSFER', productId: data.productId,
          variantId: data.variantId || null, fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId, stockLevelId: fromStock.id, quantity: data.quantity,
          beforeQty: fromStock.quantity, afterQty: fromStock.quantity - data.quantity,
          note: data.note, createdById: userId,
        },
      });

      return { from: fromStock, to: toStock };
    });
  },
};
