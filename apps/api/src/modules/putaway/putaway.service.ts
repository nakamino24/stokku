import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';
import { StockService } from '../stock/stock.service';
import { withInventoryTransaction } from '../inventory/inventory-posting.service';

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

const taskStatuses = new Set<PutawayStatus>(['READY', 'CLAIMED', 'COMPLETED', 'EXCEPTION']);

function toTask(line: {
  id: string;
  taskStatus: PutawayStatus;
  goodsReceiptId: string;
  warehouseId: string;
  sourceBinId: string | null;
  destinationBinId: string | null;
  productId: string;
  variantId: string | null;
  acceptedQty: Prisma.Decimal;
  purchaseOrderItemId: string;
  claimedById: string | null;
  completedAt: Date | null;
}): PutawayTaskRecord {
  return {
    id: line.id,
    status: line.taskStatus,
    warehouseId: line.warehouseId,
    sourceBinId: line.sourceBinId,
    destinationBinId: line.destinationBinId,
    productId: line.productId,
    variantId: line.variantId,
    quantity: line.acceptedQty.toString(),
    receiptId: line.goodsReceiptId,
    purchaseOrderItemId: line.purchaseOrderItemId,
    claimedById: line.claimedById,
    completedAt: line.completedAt,
  };
}

export const PutawayService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);
    const status = typeof query.status === 'string' && taskStatuses.has(query.status as PutawayStatus)
      ? query.status as PutawayStatus
      : undefined;
    const where: Prisma.GoodsReceiptLineWhereInput = {
      goodsReceipt: { organizationId: orgId, ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}) },
      acceptedQty: { gt: 0 },
      taskStatus: status ?? { in: ['READY', 'CLAIMED', 'COMPLETED', 'EXCEPTION'] },
    };

    const [rows, total] = await Promise.all([
      prisma.goodsReceiptLine.findMany({
        where,
        include: { goodsReceipt: { select: { id: true, warehouseId: true, binId: true } } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'asc' }],
      }),
      prisma.goodsReceiptLine.count({ where }),
    ]);

    return paginatedResult(rows.map((line) => toTask({
      id: line.id,
      taskStatus: line.taskStatus,
      goodsReceiptId: line.goodsReceiptId,
      warehouseId: line.goodsReceipt.warehouseId,
      sourceBinId: line.goodsReceipt.binId,
      destinationBinId: line.destinationBinId,
      productId: line.productId,
      variantId: line.variantId,
      acceptedQty: line.acceptedQty,
      purchaseOrderItemId: line.purchaseOrderItemId,
      claimedById: line.claimedById,
      completedAt: line.completedAt,
    })), total, pagination);
  },

  async claim(orgId: string, userId: string, id: string) {
    return withInventoryTransaction(async (tx) => {
      const task = await tx.goodsReceiptLine.findFirst({ where: { id, goodsReceipt: { organizationId: orgId }, acceptedQty: { gt: 0 } }, include: { goodsReceipt: true } });
      if (!task) throw AppError.notFound('Putaway task not found');
      const scope = await getWarehouseScope(tx, orgId, userId);
      if (!scope.global && !scope.warehouseIds.includes(task.goodsReceipt.warehouseId)) throw AppError.forbidden('You do not have access to this putaway task');
      if (task.taskStatus === 'CLAIMED' && task.claimedById === userId) return { id: task.id, receiptId: task.goodsReceiptId, warehouseId: task.goodsReceipt.warehouseId, status: 'CLAIMED' as const, claimedById: userId, quantity: task.acceptedQty.toString() };
      if (task.taskStatus !== 'READY') throw AppError.conflict('Putaway task is no longer ready');
      const claimed = await tx.goodsReceiptLine.update({ where: { id }, data: { taskStatus: 'CLAIMED', claimedById: userId, claimedAt: new Date() }, include: { goodsReceipt: true } });
      return { id: claimed.id, receiptId: claimed.goodsReceiptId, warehouseId: claimed.goodsReceipt.warehouseId, status: 'CLAIMED' as const, claimedById: userId, quantity: claimed.acceptedQty.toString() };
    });
  },

  async complete(orgId: string, userId: string, id: string, data: { destinationBinId: string; note?: string }) {
    const task = await prisma.goodsReceiptLine.findFirst({ where: { id, goodsReceipt: { organizationId: orgId }, acceptedQty: { gt: 0 }, taskStatus: 'CLAIMED', claimedById: userId }, include: { goodsReceipt: true } });
    if (!task) throw AppError.conflict('Putaway task must be claimed by the current operator');
    const destination = await prisma.warehouseBin.findFirst({ where: { id: data.destinationBinId, zone: { warehouseId: task.goodsReceipt.warehouseId, warehouse: { organizationId: orgId } } } });
    if (!destination) throw AppError.notFound('Destination bin not found');

    const transfer = await StockService.transfer(orgId, userId, {
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
    const completed = await prisma.goodsReceiptLine.updateMany({ where: { id, taskStatus: 'CLAIMED', claimedById: userId }, data: { taskStatus: 'COMPLETED', destinationBinId: destination.id, completedAt: new Date() } });
    if (completed.count !== 1) throw AppError.conflict('Putaway task changed while completing');
    return { id: task.id, receiptId: task.goodsReceiptId, warehouseId: task.goodsReceipt.warehouseId, destinationBinId: destination.id, status: 'COMPLETED' as const, transfer };
  },

  async exception(orgId: string, userId: string, id: string, data: { reason: string; note?: string }) {
    const task = await prisma.goodsReceiptLine.findFirst({ where: { id, goodsReceipt: { organizationId: orgId }, acceptedQty: { gt: 0 }, taskStatus: { in: ['READY', 'CLAIMED'] } }, include: { goodsReceipt: true } });
    if (!task) throw AppError.notFound('Putaway task not found');
    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(task.goodsReceipt.warehouseId)) throw AppError.forbidden('You do not have access to this putaway task');
    const flagged = await prisma.goodsReceiptLine.update({ where: { id }, data: { taskStatus: 'EXCEPTION', exceptionReason: data.reason } });
    return { id: flagged.id, receiptId: task.goodsReceiptId, warehouseId: task.goodsReceipt.warehouseId, status: 'EXCEPTION' as const, reason: data.reason, note: data.note, flaggedById: userId };
  },
};
