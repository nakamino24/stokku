import { z } from 'zod';

export const completePackSchema = z.object({
  packedQty: z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal quantity with at most 6 decimal places'),
  cartons: z.number().int().min(1).max(1000).optional(),
  note: z.string().max(500).optional(),
});

export const packingExceptionSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  note: z.string().max(500).optional(),
});
