"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
exports.createSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=suppliers.schema.js.map