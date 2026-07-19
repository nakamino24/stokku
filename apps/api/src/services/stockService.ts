import { prisma, StockLevel, StockMovement } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class StockService {
  static async getLevels(workspaceId: string, params: {
    warehouseId?: string;
    variantId?: string;
    lowStock?: boolean;
  }) {
    const where: Record<string, unknown> = {
      warehouse: { workspaceId },
    };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.variantId) where.variantId = params.variantId;

    const levels = await prisma.stockLevel.findMany({
      where: where as any,
      include: {
        variant: { select: { id: true, sku: true, name: true, price: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (params.lowStock) {
      return levels.filter(l => l.reorderPoint != null && l.onHand <= l.reorderPoint!);
    }

    return levels;
  }

  static async adjust(data: {
    workspaceId: string;
    variantId: string;
    warehouseId: string;
    quantity: number;
    type: string;
    reference?: string;
    reason?: string;
    userId: string;
  }): Promise<StockLevel> {
    const variant = await prisma.productVariant.findFirst({
      where: { id: data.variantId },
      include: { product: { select: { workspaceId: true } } },
    });
    if (!variant || variant.product.workspaceId !== data.workspaceId) {
      throw AppError.notFound('Variant not found');
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, workspaceId: data.workspaceId },
    });
    if (!warehouse) throw AppError.notFound('Warehouse not found');

    const stockLevel = await prisma.stockLevel.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: data.warehouseId,
          variantId: data.variantId,
        },
      },
      create: {
        warehouseId: data.warehouseId,
        variantId: data.variantId,
        onHand: data.quantity > 0 ? data.quantity : 0,
        allocated: 0,
        available: data.quantity > 0 ? data.quantity : 0,
      },
      update: {
        onHand: { increment: data.quantity },
        available: { increment: data.quantity },
      },
    });

    const beforeQty = stockLevel.onHand - data.quantity;
    const afterQty = stockLevel.onHand;

    await prisma.stockMovement.create({
      data: {
        stockLevelId: stockLevel.id,
        variantId: data.variantId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        reference: data.reference ?? null,
        reason: data.reason ?? null,
        beforeQty,
        afterQty,
        userId: data.userId,
      },
    });

    logger.info('Stock:adjust', {
      variantId: data.variantId,
      warehouseId: data.warehouseId,
      quantity: data.quantity,
      type: data.type,
      beforeQty,
      afterQty,
    });

    return prisma.stockLevel.findUnique({
      where: { id: stockLevel.id },
      include: {
        variant: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    }) as Promise<StockLevel>;
  }

  static async getMovements(workspaceId: string, params: {
    variantId?: string;
    warehouseId?: string;
    skip?: number;
    take?: number;
  }) {
    const { skip = 0, take = 50 } = params;
    const where: Record<string, unknown> = {
      warehouse: { workspaceId },
    };
    if (params.variantId) where.variantId = params.variantId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    const [data, count] = await Promise.all([
      prisma.stockMovement.findMany({
        skip,
        take,
        where: where as any,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.stockMovement.count({ where: where as any }),
    ]);

    return { data, count };
  }
}
