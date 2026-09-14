import { z } from 'zod';

export const postShipmentSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required').max(120),
  carrier: z.string().min(1, 'Carrier is required').max(80),
  note: z.string().max(500).optional(),
});

export const voidShipmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  note: z.string().max(500).optional(),
});
