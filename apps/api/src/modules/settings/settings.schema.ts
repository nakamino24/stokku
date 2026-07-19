import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  dateFormat: z.string().optional(),
});
