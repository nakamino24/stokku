"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const roles_service_1 = require("./roles.service");
const roles_schema_1 = require("./roles.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await roles_service_1.RolesService.list(user.organizationId);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: roles_schema_1.createRoleSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await roles_service_1.RolesService.create(user.organizationId, req.body);
    res.status(201).json(result);
}));
router.put('/:id', (0, validate_1.validate)({ body: roles_schema_1.updateRoleSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await roles_service_1.RolesService.update(user.organizationId, req.params.id, req.body);
    res.json(result);
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    await roles_service_1.RolesService.delete(user.organizationId, req.params.id);
    res.status(204).send();
}));
exports.default = router;
//# sourceMappingURL=roles.routes.js.map