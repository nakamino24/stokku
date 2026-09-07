import { z } from 'zod';

const unsignedDecimal = z.preprocess(
  (value) => typeof value === 'number' ? String(value) : value,
  z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal value with at most 6 decimal places'),
);

const variantFields = {
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  unitPrice: unsignedDecimal.optional(),
  costPrice: unsignedDecimal.optional(),
  options: z.record(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
};

const createVariantSchema = z.object({
  ...variantFields,
  unitPrice: unsignedDecimal.default('0'),
  costPrice: unsignedDecimal.default('0'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateVariantSchema = z.object({
  id: z.string().uuid().optional(),
  ...variantFields,
}).partial().superRefine((variant, context) => {
  if (!variant.id && !variant.name) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'New variants require a name' });
  }
});

const productFields = {
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  unitPrice: unsignedDecimal.default('0'),
  costPrice: unsignedDecimal.default('0'),
  taxRate: unsignedDecimal.default('0'),
  unit: z.string().default('pcs'),
  minStock: unsignedDecimal.default('0'),
  maxStock: unsignedDecimal.optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  weight: unsignedDecimal.optional().nullable(),
  weightUnit: z.string().default('kg'),
  isActive: z.boolean().default(true),
};

export const createProductSchema = z.object({
  ...productFields,
  variants: z.array(createVariantSchema).optional(),
  supplierIds: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = z.object({
  ...productFields,
  variants: z.array(updateVariantSchema).optional(),
  supplierIds: z.array(z.string().uuid()).optional(),
}).partial();
