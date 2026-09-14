import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase kebab-case').max(100),
  description: z.string().max(1000).optional(),
  permissions: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict();

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase kebab-case').max(100).optional(),
  description: z.string().max(1000).optional(),
  permissions: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict();
