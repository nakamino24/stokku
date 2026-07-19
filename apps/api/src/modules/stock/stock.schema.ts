import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().refine(v => v !== 0, 'Quantity must be non-zero'),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().int().positive('Transfer quantity must be positive'),
  note: z.string().optional(),
});
