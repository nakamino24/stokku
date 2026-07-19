"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    slug: zod_1.z.string().min(1, 'Slug is required'),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    slug: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=roles.schema.js.map