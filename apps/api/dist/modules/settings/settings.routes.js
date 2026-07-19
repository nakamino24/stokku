"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const settings_service_1 = require("./settings.service");
const settings_schema_1 = require("./settings.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('ADMIN'));
router.get('/organization', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await settings_service_1.SettingsService.getOrganization(user.organizationId);
    res.json(result);
}));
router.put('/organization', (0, validate_1.validate)({ body: settings_schema_1.updateOrganizationSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await settings_service_1.SettingsService.updateOrganization(user.organizationId, req.body);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map