import { StockService } from '../stock.service';

jest.mock('@stokku/database', () => ({
  prisma: {
    stockLevel: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    product: { findFirst: jest.fn() },
    warehouse: { findFirst: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../../config', () => ({
  config: {},
}));

const { prisma } = jest.requireMock('@stokku/database');

function mockTx<T>(fn: (tx: any) => T): Promise<T> {
  const tx = {
    stockLevel: { findFirst: prisma.stockLevel.findFirst, upsert: prisma.stockLevel.upsert, update: prisma.stockLevel.update },
    product: { findFirst: prisma.product.findFirst },
    warehouse: { findFirst: prisma.warehouse.findFirst },
    stockMovement: { create: prisma.stockMovement.create },
  };
  return Promise.resolve(fn(tx));
}

describe('StockService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('adjust', () => {
    it('should upsert stock level and create movement', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1' });
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue({ id: 'wh-1' });
      (prisma.stockLevel.upsert as jest.Mock).mockResolvedValue({ id: 'sl-1', quantity: 20, available: 20 });
      (prisma.$transaction as jest.Mock).mockImplementation(mockTx);

      const result = await StockService.adjust('org-1', 'user-1', {
        productId: 'prod-1', warehouseId: 'wh-1', quantity: 20,
      });

      expect(result).toBeDefined();
      expect(prisma.stockLevel.upsert).toHaveBeenCalled();
    });

    it('should throw for zero quantity', async () => {
      await expect(StockService.adjust('org-1', 'user-1', {
        productId: 'prod-1', warehouseId: 'wh-1', quantity: 0,
      })).rejects.toThrow('Quantity must be non-zero');
    });

    it('should throw for invalid product', async () => {
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(StockService.adjust('org-1', 'user-1', {
        productId: 'invalid', warehouseId: 'wh-1', quantity: 10,
      })).rejects.toThrow('Product not found');
    });
  });

  describe('transfer', () => {
    const transferData = {
      productId: 'prod-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', quantity: 10,
    };

    it('should transfer stock between warehouses', async () => {
      (prisma.stockLevel.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'sl-1', quantity: 50, available: 50 });
      (prisma.stockLevel.upsert as jest.Mock).mockResolvedValue({ id: 'sl-2', quantity: 10, available: 10 });
      (prisma.stockLevel.update as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation(mockTx);

      const result = await StockService.transfer('org-1', 'user-1', transferData);
      expect(result).toBeDefined();
      expect(prisma.stockLevel.update).toHaveBeenCalled();
      expect(prisma.stockLevel.upsert).toHaveBeenCalled();
    });

    it('should throw for same warehouse transfer', async () => {
      await expect(StockService.transfer('org-1', 'user-1', { ...transferData, toWarehouseId: 'wh-1' }))
        .rejects.toThrow('Source and destination');
    });

    it('should throw for insufficient stock', async () => {
      (prisma.stockLevel.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'sl-1', quantity: 5, available: 5 });
      (prisma.$transaction as jest.Mock).mockImplementation(mockTx);

      await expect(StockService.transfer('org-1', 'user-1', transferData))
        .rejects.toThrow('Insufficient stock');
    });
  });
});
