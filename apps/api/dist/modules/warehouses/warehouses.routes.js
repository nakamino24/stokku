"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const warehouses_service_1 = require("./warehouses.service");
const warehouses_schema_1 = require("./warehouses.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, rbac_1.requireRole)('INVENTORY_MANAGER'));
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.list(user.organizationId);
    res.json(result);
}));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.getById(user.organizationId, req.params.id);
    res.json(result);
}));
router.post('/', (0, validate_1.validate)({ body: warehouses_schema_1.createWarehouseSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.create(user.organizationId, req.body);
    res.status(201).json(result);
}));
router.put('/:id', (0, validate_1.validate)({ body: warehouses_schema_1.updateWarehouseSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.update(user.organizationId, req.params.id, req.body);
    res.json(result);
}));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    await warehouses_service_1.WarehouseService.delete(user.organizationId, req.params.id);
    res.status(204).send();
}));
router.post('/:id/zones', (0, validate_1.validate)({ body: warehouses_schema_1.createZoneSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.createZone(user.organizationId, req.params.id, req.body);
    res.status(201).json(result);
}));
router.post('/zones/:zoneId/bins', (0, validate_1.validate)({ body: warehouses_schema_1.createBinSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await warehouses_service_1.WarehouseService.createBin(user.organizationId, req.params.zoneId, req.body);
    res.status(201).json(result);
}));
exports.default = router;
//# sourceMappingURL=warehouses.routes.js.map