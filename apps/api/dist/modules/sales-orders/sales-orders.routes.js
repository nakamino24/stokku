"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const sales_orders_service_1 = require("./sales-orders.service");
const sales_orders_schema_1 = require("./sales-orders.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await sales_orders_service_1.SalesOrderService.list(user.organizationId, req.query);
    res.json(result);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await sales_orders_service_1.SalesOrderService.getById(user.organizationId, req.params.id);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: sales_orders_schema_1.createSalesOrderSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await sales_orders_service_1.SalesOrderService.create(user.organizationId, user.id, req.body);
    res.status(201).json(result);
}));
router.patch('/:id/status', (0, validate_1.validate)({ body: sales_orders_schema_1.updateSalesOrderStatusSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await sales_orders_service_1.SalesOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=sales-orders.routes.js.map