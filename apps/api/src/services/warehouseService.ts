import { prisma, Warehouse } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class WarehouseService {
  static async list(workspaceId: string) {
    return prisma.warehouse.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { stockLevels: true, movements: true } } },
    });
  }

  static async getById(id: string, workspaceId: string): Promise<Warehouse> {
    const w = await prisma.warehouse.findFirst({ where: { id, workspaceId } });
    if (!w) throw AppError.notFound('Warehouse not found');
    return w;
  }

  static async create(data: {
    workspaceId: string;
    name: string;
    code: string;
    description?: string;
    address?: string;
  }): Promise<Warehouse> {
    logger.info('Warehouse:create', { name: data.name, code: data.code });

    const existing = await prisma.warehouse.findFirst({
      where: { workspaceId: data.workspaceId, code: data.code },
    });
    if (existing) throw AppError.conflict(`Warehouse code "${data.code}" already exists`);

    return prisma.warehouse.create({ data });
  }

  static async update(id: string, workspaceId: string, data: {
    name?: string;
    code?: string;
    description?: string;
    address?: string;
    isActive?: boolean;
  }): Promise<Warehouse> {
    const w = await prisma.warehouse.findFirst({ where: { id, workspaceId } });
    if (!w) throw AppError.notFound('Warehouse not found');

    if (data.code && data.code !== w.code) {
      const existing = await prisma.warehouse.findFirst({
        where: { workspaceId, code: data.code, id: { not: id } },
      });
      if (existing) throw AppError.conflict(`Warehouse code "${data.code}" already exists`);
    }

    return prisma.warehouse.update({ where: { id }, data });
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    const w = await prisma.warehouse.findFirst({ where: { id, workspaceId } });
    if (!w) throw AppError.notFound('Warehouse not found');

    const stockCount = await prisma.stockLevel.count({ where: { warehouseId: id } });
    if (stockCount > 0) {
      throw AppError.badRequest('Cannot delete warehouse with existing stock. Transfer or remove stock first.');
    }

    await prisma.warehouse.delete({ where: { id } });
  }
}
