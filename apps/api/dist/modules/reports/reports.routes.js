"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_1 = require("../../middleware/auth");
const reports_service_1 = require("./reports.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/stock-value', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.stockValue(user.organizationId);
    res.json(result);
}));
router.get('/stock-movement', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.stockMovement(user.organizationId, req.query.startDate, req.query.endDate);
    res.json(result);
}));
router.get('/sales', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.sales(user.organizationId, req.query.startDate, req.query.endDate);
    res.json(result);
}));
router.get('/purchasing', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.purchasing(user.organizationId, req.query.startDate, req.query.endDate);
    res.json(result);
}));
router.get('/inventory-valuation', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.inventoryValuation(user.organizationId);
    res.json(result);
}));
router.get('/audit-log', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await reports_service_1.ReportsService.auditLog(user.organizationId, req.query);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=reports.routes.js.map