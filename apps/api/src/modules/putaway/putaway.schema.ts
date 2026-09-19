import { z } from 'zod';

export const completePutawaySchema = z.object({
  destinationBinId: z.string().min(1, 'Destination bin is required'),
  note: z.string().max(500).optional(),
});

export const putawayExceptionSchema = z.object({
  reason: z.string().min(1, 'Exception reason is required').max(500),
  note: z.string().max(500).optional(),
});
