"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBinSchema = exports.createZoneSchema = exports.updateWarehouseSchema = exports.createWarehouseSchema = void 0;
const zod_1 = require("zod");
exports.createWarehouseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    code: zod_1.z.string().min(1, 'Code is required'),
    address: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateWarehouseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    code: zod_1.z.string().min(1).optional(),
    address: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createZoneSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    code: zod_1.z.string().min(1, 'Code is required'),
    description: zod_1.z.string().optional(),
});
exports.createBinSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    code: zod_1.z.string().min(1, 'Code is required'),
    description: zod_1.z.string().optional(),
    maxCapacity: zod_1.z.number().nonnegative().optional(),
});
//# sourceMappingURL=warehouses.schema.js.map