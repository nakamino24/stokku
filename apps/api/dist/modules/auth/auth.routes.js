"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const auth_service_1 = require("./auth.service");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validate)({ body: auth_schema_1.registerSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.register(req.body);
    res.status(201).json(result);
}));
router.post('/login', (0, validate_1.validate)({ body: auth_schema_1.loginSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.login(req.body.email, req.body.password);
    res.json(result);
}));
router.post('/refresh', (0, validate_1.validate)({ body: auth_schema_1.refreshSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.refresh(req.body.refreshToken);
    res.json(result);
}));
router.get('/me', auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const profile = await auth_service_1.AuthService.getProfile(user.id);
    res.json(profile);
}));
router.put('/me', auth_1.authMiddleware, (0, validate_1.validate)({ body: auth_schema_1.updateProfileSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await auth_service_1.AuthService.updateProfile(user.id, req.body);
    res.json(result);
}));
router.post('/change-password', auth_1.authMiddleware, (0, validate_1.validate)({ body: auth_schema_1.changePasswordSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const result = await auth_service_1.AuthService.changePassword(user.id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
}));
router.post('/forgot-password', (0, validate_1.validate)({ body: auth_schema_1.forgotPasswordSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.requestPasswordReset(req.body.email);
    res.json(result);
}));
router.post('/reset-password', (0, validate_1.validate)({ body: auth_schema_1.resetPasswordSchema }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await auth_service_1.AuthService.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map