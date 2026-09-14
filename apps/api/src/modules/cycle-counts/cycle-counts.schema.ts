import { z } from 'zod';

export const createCycleCountSchema = z.object({
  warehouseId: z.string().uuid(),
  zone: z.string().min(1).max(80).optional(),
  bins: z.array(z.string().min(1).max(80)).min(1).max(200),
  note: z.string().max(500).optional(),
});

export const executeCycleCountSchema = z.object({
  binId: z.string().uuid(),
  countedQty: z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal quantity with at most 6 decimal places'),
  reason: z.string().min(3).max(500).optional(),
  note: z.string().max(500).optional(),
});

export const approveCycleCountSchema = z.object({
  approved: z.boolean(),
  reason: z.string().min(3).max(500).optional(),
});
