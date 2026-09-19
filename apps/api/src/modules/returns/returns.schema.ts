import { z } from 'zod';

export const createReturnSchema = z.object({
  salesOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  reason: z.string().min(3).max(500),
  quantity: z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal quantity with at most 6 decimal places'),
  note: z.string().max(500).optional(),
});

export const approveReturnSchema = z.object({
  approved: z.boolean(),
  note: z.string().max(500).optional(),
});

export const completeReturnSchema = z.object({
  disposition: z.enum(['RESTOCK', 'DISCARD', 'REWORK']),
  note: z.string().max(500).optional(),
});
