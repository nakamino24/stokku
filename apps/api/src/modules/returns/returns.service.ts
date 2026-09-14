import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

const db = prisma as any;

export type ReturnStatus = 'OPEN' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

interface ReturnRecord {
  id: string;
  status: ReturnStatus;
  salesOrderId: string;
  warehouseId: string;
  quantity: string;
}

export const ReturnsService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: any = {
      organizationId: orgId,
      ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
    };

    const [rows, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        select: {
          id: true,
          status: true,
          salesOrderId: true,
          warehouseId: true,
          quantity: true,
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      db.returnRequest.count({ where }),
    ]);

    const items: ReturnRecord[] = rows.map((row: any) => ({
      id: row.id,
      status: row.status as ReturnStatus,
      salesOrderId: row.salesOrderId,
      warehouseId: row.warehouseId,
      quantity: row.quantity.toString(),
    }));

    return paginatedResult(items, total, pagination);
  },

  async create(orgId: string, userId: string, data: { salesOrderId: string; warehouseId: string; reason: string; quantity: string; note?: string }) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(data.warehouseId)) {
      throw AppError.forbidden('You do not have access to this warehouse');
    }

    const quantity = new Prisma.Decimal(data.quantity);
    if (quantity.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Return quantity must be greater than zero');
    }

    const item = await db.returnRequest.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        reason: data.reason,
        quantity,
        note: data.note ?? null,
        status: 'OPEN',
      },
    });

    return { id: item.id, status: item.status as ReturnStatus, salesOrderId: item.salesOrderId, warehouseId: item.warehouseId };
  },

  async approve(orgId: string, userId: string, id: string, data: { approved: boolean; note?: string }) {
    const req = await db.returnRequest.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!req) {
      throw AppError.notFound('Return request not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(req.warehouseId)) {
      throw AppError.forbidden('You do not have access to this return request');
    }

    return {
      id: req.id,
      status: data.approved ? 'APPROVED' : 'REJECTED',
      salesOrderId: req.salesOrderId,
      warehouseId: req.warehouseId,
      note: data.note,
      approvedById: userId,
    };
  },

  async complete(orgId: string, userId: string, id: string, data: { disposition: 'RESTOCK' | 'DISCARD' | 'REWORK'; note?: string }) {
    const req = await db.returnRequest.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!req) {
      throw AppError.notFound('Return request not found');
    }

    return {
      id: req.id,
      status: 'COMPLETED' as const,
      salesOrderId: req.salesOrderId,
      warehouseId: req.warehouseId,
      disposition: data.disposition,
      note: data.note,
      completedById: userId,
    };
  },
};
