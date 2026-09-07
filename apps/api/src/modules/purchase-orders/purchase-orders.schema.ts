import { z } from 'zod';

const unsignedDecimal = z.preprocess(
  (value) => typeof value === 'number' ? String(value) : value,
  z.string().regex(/^\d+(?:\.\d{1,6})?$/, 'Use a decimal value with at most 6 decimal places'),
);
const positiveDecimal = unsignedDecimal.refine((value) => !/^0(?:\.0+)?$/.test(value), 'Quantity must be positive');

const poItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: positiveDecimal,
  unitPrice: unsignedDecimal,
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  taxRate: unsignedDecimal.optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'SENT', 'CANCELLED']),
});

const receiveItemSchema = z.object({
  itemId: z.string().uuid(),
  receivedQty: positiveDecimal,
  acceptedQty: unsignedDecimal.optional(),
  rejectedQty: unsignedDecimal.optional(),
});

export const receivePurchaseOrderSchema = z.object({
  warehouseId: z.string().uuid('warehouseId is required'),
  binId: z.string().uuid().optional().nullable(),
  supplierDeliveryReference: z.string().max(200).optional(),
  items: z.array(receiveItemSchema)
    .min(1, 'At least one item is required')
    .superRefine((items, context) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.itemId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'itemId'],
            message: 'Each purchase order item may appear only once per receipt',
          });
        }
        seen.add(item.itemId);
      });
    }),
});
