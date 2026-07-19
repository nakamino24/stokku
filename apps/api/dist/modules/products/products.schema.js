"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    sku: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    unitPrice: zod_1.z.number().min(0).default(0),
    costPrice: zod_1.z.number().min(0).default(0),
    taxRate: zod_1.z.number().min(0).default(0),
    unit: zod_1.z.string().default('pcs'),
    minStock: zod_1.z.number().int().min(0).default(0),
    maxStock: zod_1.z.number().int().optional().nullable(),
    imageUrl: zod_1.z.string().optional().nullable(),
    weight: zod_1.z.number().min(0).optional().nullable(),
    weightUnit: zod_1.z.string().default('kg'),
    isActive: zod_1.z.boolean().default(true),
    variants: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        sku: zod_1.z.string().optional(),
        barcode: zod_1.z.string().optional(),
        unitPrice: zod_1.z.number().min(0).default(0),
        costPrice: zod_1.z.number().min(0).default(0),
        options: zod_1.z.record(zod_1.z.string()).optional(),
        sortOrder: zod_1.z.number().int().default(0),
    })).optional(),
    supplierIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
//# sourceMappingURL=products.schema.js.map