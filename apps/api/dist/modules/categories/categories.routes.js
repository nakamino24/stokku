"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const categories_service_1 = require("./categories.service");
const categories_schema_1 = require("./categories.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await categories_service_1.CategoryService.list(user.organizationId);
    res.json(result);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await categories_service_1.CategoryService.getById(user.organizationId, req.params.id);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: categories_schema_1.createCategorySchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await categories_service_1.CategoryService.create(user.organizationId, req.body);
    res.status(201).json(result);
}));
router.put('/:id', (0, validate_1.validate)({ body: categories_schema_1.updateCategorySchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await categories_service_1.CategoryService.update(user.organizationId, req.params.id, req.body);
    res.json(result);
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    await categories_service_1.CategoryService.delete(user.organizationId, req.params.id);
    res.status(204).send();
}));
exports.default = router;
//# sourceMappingURL=categories.routes.js.map