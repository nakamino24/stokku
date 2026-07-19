import { WarehouseService } from '../../services/warehouseService';
import { AppError } from '../../utils/errors';

jest.mock('@stokku/database', () => ({
  prisma: {
    warehouse: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockLevel: { count: jest.fn() },
  },
}));

describe('WarehouseService', () => {
  const mockWarehouse = {
    id: 'wh-1',
    workspaceId: 'ws-1',
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    description: 'Primary storage',
    address: '123 St',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return warehouses with counts', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findMany.mockResolvedValue([mockWarehouse]);
      const result = await WarehouseService.list('ws-1');
      expect(result).toHaveLength(1);
      expect(prisma.warehouse.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { stockLevels: true, movements: true } } },
      });
    });
  });

  describe('getById', () => {
    it('should return warehouse if found', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      const result = await WarehouseService.getById('wh-1', 'ws-1');
      expect(result).toEqual(mockWarehouse);
    });

    it('should throw if not found', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(null);
      await expect(WarehouseService.getById('wh-1', 'ws-1')).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(null);
      prisma.warehouse.create.mockResolvedValue(mockWarehouse);
      const result = await WarehouseService.create({
        workspaceId: 'ws-1', name: 'Main Warehouse', code: 'WH-MAIN',
      });
      expect(result).toEqual(mockWarehouse);
    });

    it('should throw conflict on duplicate code', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      await expect(WarehouseService.create({
        workspaceId: 'ws-1', name: 'Main Warehouse', code: 'WH-MAIN',
      })).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete empty warehouse', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stockLevel.count.mockResolvedValue(0);
      prisma.warehouse.delete.mockResolvedValue(mockWarehouse);
      await expect(WarehouseService.delete('wh-1', 'ws-1')).resolves.not.toThrow();
    });

    it('should throw if warehouse has stock', async () => {
      const { prisma } = require('@stokku/database');
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stockLevel.count.mockResolvedValue(5);
      await expect(WarehouseService.delete('wh-1', 'ws-1')).rejects.toThrow(AppError);
    });
  });
});
