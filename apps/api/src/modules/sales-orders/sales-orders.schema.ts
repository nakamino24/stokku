import { z } from 'zod';

const unsignedDecimal = z.preprocess(
  (value) => typeof value === 'number' ? String(value) : value,
  z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal value with at most 6 decimal places'),
);
const positiveDecimal = unsignedDecimal.refine((value) => !/^0(?:\.0+)?$/.test(value), 'Quantity must be positive');

const soItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: positiveDecimal,
  unitPrice: unsignedDecimal,
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  taxRate: unsignedDecimal.optional(),
  items: z.array(soItemSchema).min(1, 'At least one item is required'),
});

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'ALLOCATED',
    'PICKING',
    'PICKED',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CLOSED',
    'CANCELLED',
    'RETURNED',
  ]),
});
