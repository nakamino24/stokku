import { z } from 'zod';

const decimalString = z.preprocess(
  (value) => typeof value === 'number' ? String(value) : value,
  z.string().regex(/^-?\d+(?:\.\d{1,6})?$/, 'Use a decimal value with at most 6 decimal places'),
);

const positiveDecimal = decimalString.refine((value) => !value.startsWith('-') && !/^0(?:\.0+)?$/.test(value), {
  message: 'Quantity must be positive',
});

export const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid(),
  binId: z.string().uuid().optional().nullable(),
  quantity: decimalString.refine((value) => !/^-?0(?:\.0+)?$/.test(value), 'Quantity must be non-zero'),
  reasonCode: z.enum([
    'DAMAGE',
    'SHRINKAGE',
    'COUNT_VARIANCE',
    'EXPIRED',
    'FOUND_STOCK',
    'DATA_CORRECTION',
    'QUALITY_REJECTION',
    'RETURN_ADJUSTMENT',
    'OTHER',
  ]),
  reason: z.string().min(3).max(500).optional(),
  note: z.string().max(2000).optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  fromWarehouseId: z.string().uuid(),
  fromBinId: z.string().uuid().optional().nullable(),
  toWarehouseId: z.string().uuid(),
  toBinId: z.string().uuid().optional().nullable(),
  quantity: positiveDecimal,
  note: z.string().max(2000).optional(),
});

export const reverseStockMovementSchema = z.object({
  reason: z.string().min(3).max(500),
});
