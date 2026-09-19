import { z } from 'zod';

export const confirmPickSchema = z.object({
  pickedQty: z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal quantity with at most 6 decimal places'),
  note: z.string().max(500).optional(),
});

export const shortPickSchema = z.object({
  shortQty: z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal quantity with at most 6 decimal places'),
  reason: z.string().min(1, 'Reason is required').max(500),
  note: z.string().max(500).optional(),
});
