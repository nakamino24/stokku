import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { getWarehouseScope, warehouseIdFilter } from '../../middleware/warehouseScope';

const db = prisma as any;

export type CycleCountStatus = 'OPEN' | 'COUNTED' | 'APPROVED' | 'REJECTED';

interface CycleCountRecord {
  id: string;
  status: CycleCountStatus;
  warehouseId: string;
  zone?: string;
  bins: string[];
}

export const CycleCountService = {
  async list(orgId: string, userId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const scope = await getWarehouseScope(prisma, orgId, userId);
    const warehouseFilter = warehouseIdFilter(scope);

    const where: any = {
      organizationId: orgId,
      ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
    };

    const [rows, total] = await Promise.all([
      db.cycleCount.findMany({
        where,
        select: {
          id: true,
          status: true,
          warehouseId: true,
          zone: true,
          createdAt: true,
          bins: true,
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      db.cycleCount.count({ where }),
    ]);

    const items: CycleCountRecord[] = rows.map((row: any) => ({
      id: row.id,
      status: row.status as CycleCountStatus,
      warehouseId: row.warehouseId,
      zone: row.zone ?? undefined,
      bins: Array.isArray(row.bins) ? row.bins as string[] : [],
    }));

    return paginatedResult(items, total, pagination);
  },

  async create(orgId: string, userId: string, data: { warehouseId: string; zone?: string; bins: string[]; note?: string }) {
    const warehouseId = data.warehouseId;
    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(warehouseId)) {
      throw AppError.forbidden('You do not have access to this warehouse');
    }

    const count = await db.cycleCount.create({
      data: {
        organizationId: orgId,
        warehouseId,
        zone: data.zone ?? null,
        bins: data.bins,
        status: 'OPEN',
        createdById: userId,
        note: data.note ?? null,
      },
    });

    return { id: count.id, status: count.status as CycleCountStatus, warehouseId: count.warehouseId };
  },

  async execute(orgId: string, userId: string, id: string, data: { binId: string; countedQty: string; reason?: string; note?: string }) {
    const count = await db.cycleCount.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!count) {
      throw AppError.notFound('Cycle count not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(count.warehouseId)) {
      throw AppError.forbidden('You do not have access to this cycle count');
    }

    const qty = new Prisma.Decimal(data.countedQty);
    if (qty.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Counted quantity must be greater than zero');
    }

    return {
      id: count.id,
      status: 'COUNTED' as const,
      warehouseId: count.warehouseId,
      binId: data.binId,
      countedQty: qty.toString(),
      reason: data.reason,
      note: data.note,
      countedById: userId,
    };
  },

  async approve(orgId: string, userId: string, id: string, data: { approved: boolean; reason?: string }) {
    const count = await db.cycleCount.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!count) {
      throw AppError.notFound('Cycle count not found');
    }

    const scope = await getWarehouseScope(prisma, orgId, userId);
    if (!scope.global && !scope.warehouseIds.includes(count.warehouseId)) {
      throw AppError.forbidden('You do not have access to this cycle count');
    }

    return {
      id: count.id,
      status: data.approved ? 'APPROVED' : 'REJECTED',
      warehouseId: count.warehouseId,
      approvedById: userId,
      reason: data.reason,
    };
  },
};
