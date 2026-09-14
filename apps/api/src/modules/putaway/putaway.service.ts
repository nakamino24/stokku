import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { StockService } from '../stock/stock.service';

export type PutawayStatus = 'READY' | 'CLAIMED' | 'COMPLETED' | 'EXCEPTION';

interface PutawayTaskRecord {
  id: string;
  status: PutawayStatus;
  warehouseId: string;
  sourceBinId: string | null;
  destinationBinId: string | null;
  productId: string;
  variantId: string | null;
  quantity: string;
  receiptId: string;
  purchaseOrderItemId: string;
  claimedById?: string | null;
  completedAt?: Date | null;
}

export const PutawayService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: Prisma.GoodsReceiptLineWhereInput = {
      goodsReceipt: {
        organizationId: orgId,
        ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
      },
      acceptedQty: { gt: 0 },
    };

    const [rows, total] = await Promise.all([
      prisma.goodsReceiptLine.findMany({
        where,
        include: {
          goodsReceipt: { select: { id: true, warehouseId: true, binId: true, receiptNumber: true } },
          product: { select: { id: true, name: true, sku: true, unit: true } },
          variant: { select: { id: true, name: true, sku: true } },
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.goodsReceiptLine.count({ where }),
    ]);

    const items: PutawayTaskRecord[] = rows.map((line) => ({
      id: line.id,
      status: 'READY',
      warehouseId: line.goodsReceipt.warehouseId,
      sourceBinId: line.goodsReceipt.binId ?? null,
      destinationBinId: null,
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: line.acceptedQty.toString(),
      receiptId: line.goodsReceipt.id,
      purchaseOrderItemId: line.purchaseOrderItemId,
    }));

    return paginatedResult(items, total, pagination);
  },

  async claim(orgId: string, userId: string, id: string) {
    const task = await prisma.goodsReceiptLine.findFirst({
      where: {
        id,
        goodsReceipt: { organizationId: orgId },
        acceptedQty: { gt: 0 },
      },
      include: { goodsReceipt: true },
    });

    if (!task) {
      throw AppError.notFound('Putaway task not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(task.goodsReceipt.warehouseId)) {
      throw AppError.forbidden('You do not have access to this putaway task');
    }

    return {
      id: task.id,
      receiptId: task.goodsReceiptId,
      warehouseId: task.goodsReceipt.warehouseId,
      status: 'CLAIMED' as const,
      claimedById: userId,
      quantity: task.acceptedQty.toString(),
    };
  },

  async complete(orgId: string, userId: string, id: string, data: { destinationBinId: string; note?: string }) {
    const task = await prisma.goodsReceiptLine.findFirst({
      where: {
        id,
        goodsReceipt: { organizationId: orgId },
        acceptedQty: { gt: 0 },
      },
      include: { goodsReceipt: true },
    });

    if (!task) {
      throw AppError.notFound('Putaway task not found');
    }

    const destination = await prisma.warehouseBin.findFirst({
      where: {
        id: data.destinationBinId,
        zone: { warehouseId: task.goodsReceipt.warehouseId, warehouse: { organizationId: orgId } },
      },
    });
    if (!destination) {
      throw AppError.notFound('Destination bin not found');
    }

    const result = await StockService.transfer(orgId, userId, {
      productId: task.productId,
      variantId: task.variantId,
      fromWarehouseId: task.goodsReceipt.warehouseId,
      fromBinId: task.goodsReceipt.binId ?? null,
      toWarehouseId: task.goodsReceipt.warehouseId,
      toBinId: destination.id,
      quantity: task.acceptedQty.toString(),
      note: data.note ?? 'Putaway confirmation',
      idempotencyKey: `PUTAWAY:${task.id}:${task.goodsReceiptId}`,
    });

    return {
      id: task.id,
      receiptId: task.goodsReceiptId,
      warehouseId: task.goodsReceipt.warehouseId,
      destinationBinId: destination.id,
      status: 'COMPLETED' as const,
      transfer: result,
    };
  },

  async exception(orgId: string, userId: string, id: string, data: { reason: string; note?: string }) {
    const task = await prisma.goodsReceiptLine.findFirst({
      where: {
        id,
        goodsReceipt: { organizationId: orgId },
        acceptedQty: { gt: 0 },
      },
      include: { goodsReceipt: true },
    });

    if (!task) {
      throw AppError.notFound('Putaway task not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(task.goodsReceipt.warehouseId)) {
      throw AppError.forbidden('You do not have access to this putaway task');
    }

    return {
      id: task.id,
      receiptId: task.goodsReceiptId,
      warehouseId: task.goodsReceipt.warehouseId,
      status: 'EXCEPTION' as const,
      reason: data.reason,
      note: data.note,
      flaggedById: userId,
    };
  },
};
