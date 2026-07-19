"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferStockSchema = exports.adjustStockSchema = void 0;
const zod_1 = require("zod");
exports.adjustStockSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    warehouseId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().refine(v => v !== 0, 'Quantity must be non-zero'),
    reason: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
exports.transferStockSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    fromWarehouseId: zod_1.z.string().uuid(),
    toWarehouseId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive('Transfer quantity must be positive'),
    note: zod_1.z.string().optional(),
});
//# sourceMappingURL=stock.schema.js.map