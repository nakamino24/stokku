"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const stock_service_1 = require("./stock.service");
const stock_schema_1 = require("./stock.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await stock_service_1.StockService.list(user.organizationId, req.query);
    res.json(result);
}));
router.get('/movements', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await stock_service_1.StockService.getMovements(user.organizationId, req.query);
    res.json(result);
}));
router.get('/low-stock', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await stock_service_1.StockService.list(user.organizationId, { ...req.query, lowStock: 'true' });
    res.json(result);
}));
router.post('/adjust', (0, validate_1.validate)({ body: stock_schema_1.adjustStockSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await stock_service_1.StockService.adjust(user.organizationId, user.id, req.body);
    res.json(result);
}));
router.post('/transfer', (0, validate_1.validate)({ body: stock_schema_1.transferStockSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await stock_service_1.StockService.transfer(user.organizationId, user.id, req.body);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=stock.routes.js.map