"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const users_service_1 = require("./users.service");
const users_schema_1 = require("./users.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('ADMIN'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await users_service_1.UsersService.list(user.organizationId, req.query);
    res.json(result);
}));
router.patch('/:id/role', (0, validate_1.validate)({ body: users_schema_1.updateUserRoleSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await users_service_1.UsersService.updateRole(user.organizationId, req.params.id, req.body.role);
    res.json(result);
}));
router.patch('/:id/deactivate', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await users_service_1.UsersService.deactivate(user.organizationId, req.params.id);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=users.routes.js.map