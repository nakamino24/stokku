import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';

export const WarehouseService = {
  async list(orgId: string) {
    return prisma.warehouse.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        zones: { include: { bins: true } },
        _count: { select: { stockLevels: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(orgId: string, id: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, organizationId: orgId },
      include: {
        zones: { include: { bins: true } },
        stockLevels: {
          include: { product: { select: { name: true, sku: true } }, variant: { select: { name: true, sku: true } } },
          orderBy: { quantity: 'desc' },
          take: 100,
        },
      },
    });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return warehouse;
  },

  async create(orgId: string, data: any) {
    const existing = await prisma.warehouse.findFirst({ where: { organizationId: orgId, code: data.code } });
    if (existing) throw AppError.conflict('Warehouse code already exists');
    return prisma.warehouse.create({ data: { ...data, organizationId: orgId } });
  },

  async update(orgId: string, id: string, data: any) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return prisma.warehouse.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  },

  async createZone(orgId: string, warehouseId: string, data: { name: string; code: string; description?: string }) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: orgId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return prisma.warehouseZone.create({ data: { ...data, warehouseId } });
  },

  async createBin(orgId: string, zoneId: string, data: { code: string; maxCapacity?: number; description?: string }) {
    const zone = await prisma.warehouseZone.findFirst({ where: { id: zoneId, warehouse: { organizationId: orgId } } });
    if (!zone) throw AppError.notFound('Zone not found');
    return prisma.warehouseBin.create({ data: { ...data, zoneId } });
  },
};
