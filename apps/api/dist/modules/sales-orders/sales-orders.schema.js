"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSalesOrderStatusSchema = exports.createSalesOrderSchema = void 0;
const zod_1 = require("zod");
const soItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
});
exports.createSalesOrderSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    notes: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(1).optional(),
    items: zod_1.z.array(soItemSchema).min(1, 'At least one item is required'),
});
exports.updateSalesOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED', 'PICKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED']),
});
//# sourceMappingURL=sales-orders.schema.js.map