"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const purchase_orders_service_1 = require("./purchase-orders.service");
const purchase_orders_schema_1 = require("./purchase-orders.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchase_orders_service_1.PurchaseOrderService.list(user.organizationId, req.query);
    res.json(result);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchase_orders_service_1.PurchaseOrderService.getById(user.organizationId, req.params.id);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: purchase_orders_schema_1.createPurchaseOrderSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchase_orders_service_1.PurchaseOrderService.create(user.organizationId, user.id, req.body);
    res.status(201).json(result);
}));
router.patch('/:id/status', (0, validate_1.validate)({ body: purchase_orders_schema_1.updatePurchaseOrderStatusSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchase_orders_service_1.PurchaseOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
    res.json(result);
}));
router.post('/:id/receive', (0, validate_1.validate)({ body: purchase_orders_schema_1.receivePurchaseOrderSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await purchase_orders_service_1.PurchaseOrderService.receive(user.organizationId, user.id, req.body.warehouseId, req.params.id, req.body.items);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=purchase-orders.routes.js.map