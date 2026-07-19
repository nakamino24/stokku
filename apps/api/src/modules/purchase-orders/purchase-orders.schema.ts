import { z } from 'zod';

const poItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']),
});

const receiveItemSchema = z.object({
  itemId: z.string().uuid(),
  receivedQty: z.number().int().positive(),
});

export const receivePurchaseOrderSchema = z.object({
  warehouseId: z.string().uuid('warehouseId is required'),
  items: z.array(receiveItemSchema).min(1, 'At least one item is required'),
});
