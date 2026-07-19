import { z } from 'zod';

const soItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  items: z.array(soItemSchema).min(1, 'At least one item is required'),
});

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PICKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED']),
});
