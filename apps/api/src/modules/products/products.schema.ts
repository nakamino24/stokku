import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unitPrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  unit: z.string().default('pcs'),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  weightUnit: z.string().default('kg'),
  isActive: z.boolean().default(true),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    unitPrice: z.number().min(0).default(0),
    costPrice: z.number().min(0).default(0),
    options: z.record(z.string()).optional(),
    sortOrder: z.number().int().default(0),
  })).optional(),
  supplierIds: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
