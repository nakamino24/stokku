"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivePurchaseOrderSchema = exports.updatePurchaseOrderStatusSchema = exports.createPurchaseOrderSchema = void 0;
const zod_1 = require("zod");
const poItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
});
exports.createPurchaseOrderSchema = zod_1.z.object({
    supplierId: zod_1.z.string().uuid(),
    expectedDate: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(1).optional(),
    items: zod_1.z.array(poItemSchema).min(1, 'At least one item is required'),
});
exports.updatePurchaseOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']),
});
const receiveItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid(),
    receivedQty: zod_1.z.number().int().positive(),
});
exports.receivePurchaseOrderSchema = zod_1.z.object({
    warehouseId: zod_1.z.string().uuid('warehouseId is required'),
    items: zod_1.z.array(receiveItemSchema).min(1, 'At least one item is required'),
});
//# sourceMappingURL=purchase-orders.schema.js.map