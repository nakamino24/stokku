import { z } from 'zod';

export const createReconciliationRunSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export const resolveDiscrepancySchema = z.object({
  resolution: z.enum(['ADJUST_STORED', 'ADJUST_LEDGER', 'INVESTIGATE', 'IGNORE']),
  note: z.string().max(500).optional(),
});