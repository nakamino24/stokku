"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_1 = require("../../middleware/auth");
const dashboard_service_1 = require("./dashboard.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/summary', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await dashboard_service_1.DashboardService.getSummary(user.organizationId);
    res.json(result);
}));
router.get('/low-stock', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await dashboard_service_1.DashboardService.getLowStockAlerts(user.organizationId);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map