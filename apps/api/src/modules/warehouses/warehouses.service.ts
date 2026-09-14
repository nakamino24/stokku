import { prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import {
  assertGlobalWarehouseScope,
  assertWarehouseAccess,
  getWarehouseScope,
  warehouseIdFilter,
} from '../../middleware/warehouseScope';

export const WarehouseService = {
  async list(orgId: string, userId: string) {
    const scope = await getWarehouseScope(prisma, orgId, userId);
    return prisma.warehouse.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        ...(warehouseIdFilter(scope) ? { id: warehouseIdFilter(scope) } : {}),
      },
      include: {
        zones: { include: { bins: true } },
        _count: { select: { stockLevels: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(orgId: string, userId: string, id: string) {
    await assertWarehouseAccess(prisma, orgId, userId, id);
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, organizationId: orgId },
      include: {
        zones: { include: { bins: true } },
        stockLevels: {
          include: { product: { select: { name: true, sku: true } }, variant: { select: { name: true, sku: true } } },
          orderBy: { available: 'desc' },
          take: 100,
        },
      },
    });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return warehouse;
  },

  async create(orgId: string, userId: string, data: any) {
    await assertGlobalWarehouseScope(prisma, orgId, userId);
    const existing = await prisma.warehouse.findFirst({ where: { organizationId: orgId, code: data.code } });
    if (existing) throw AppError.conflict('Warehouse code already exists');
    return prisma.warehouse.create({ data: { ...data, organizationId: orgId } });
  },

  async update(orgId: string, userId: string, id: string, data: any) {
    await assertGlobalWarehouseScope(prisma, orgId, userId);
    const warehouse = await prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return prisma.warehouse.update({ where: { id }, data });
  },

  async delete(orgId: string, userId: string, id: string) {
    await assertGlobalWarehouseScope(prisma, orgId, userId);
    const warehouse = await prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  },

  async createZone(orgId: string, userId: string, warehouseId: string, data: { name: string; code: string; description?: string }) {
    await assertWarehouseAccess(prisma, orgId, userId, warehouseId);
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return prisma.warehouseZone.create({ data: { ...data, warehouseId } });
  },

  async createBin(orgId: string, userId: string, zoneId: string, data: { code: string; maxCapacity?: number; description?: string }) {
    const zone = await prisma.warehouseZone.findFirst({ where: { id: zoneId, warehouse: { organizationId: orgId } } });
    if (!zone) throw AppError.notFound('Zone not found');
    await assertWarehouseAccess(prisma, orgId, userId, zone.warehouseId);
    return prisma.warehouseBin.create({ data: { ...data, zoneId } });
  },
};
