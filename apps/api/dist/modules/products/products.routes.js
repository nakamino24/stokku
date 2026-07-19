"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const products_service_1 = require("./products.service");
const products_schema_1 = require("./products.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await products_service_1.ProductService.list(user.organizationId, req.query);
    res.json(result);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await products_service_1.ProductService.getById(user.organizationId, req.params.id);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: products_schema_1.createProductSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await products_service_1.ProductService.create(user.organizationId, user.id, req.body);
    res.status(201).json(result);
}));
router.put('/:id', (0, validate_1.validate)({ body: products_schema_1.updateProductSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await products_service_1.ProductService.update(user.organizationId, user.id, req.params.id, req.body);
    res.json(result);
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    await products_service_1.ProductService.delete(user.organizationId, user.id, req.params.id);
    res.status(204).send();
}));
exports.default = router;
//# sourceMappingURL=products.routes.js.map