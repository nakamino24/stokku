"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationSchema = void 0;
const zod_1 = require("zod");
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().length(3).optional(),
    timezone: zod_1.z.string().optional(),
    language: zod_1.z.string().length(2).optional(),
    dateFormat: zod_1.z.string().optional(),
});
//# sourceMappingURL=settings.schema.js.map