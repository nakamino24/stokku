"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("@stokku/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const errors_1 = require("../../utils/errors");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, { expiresIn: config_1.config.jwt.accessExpiresIn });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
}
function verifyToken(token, secret) {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
exports.AuthService = {
    async register(data) {
        const existing = await database_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw errors_1.AppError.conflict('Email already registered');
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        return database_1.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: data.organizationName,
                    slug: data.organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                },
            });
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    emailVerified: true,
                    role: 'OWNER',
                    organizationId: org.id,
                },
            });
            await tx.organization.update({
                where: { id: org.id },
                data: { ownerId: user.id },
            });
            await tx.auditLog.create({
                data: {
                    organizationId: org.id,
                    userId: user.id,
                    action: 'REGISTER',
                    entityType: 'User',
                    entityId: user.id,
                },
            });
            const tokenPayload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: org.id,
                organizationSlug: org.slug,
            };
            return {
                user: tokenPayload,
                accessToken: generateAccessToken(tokenPayload),
                refreshToken: generateRefreshToken({ id: user.id }),
            };
        });
    },
    async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: { organization: true },
        });
        if (!user || !user.passwordHash)
            throw errors_1.AppError.unauthorized('Invalid email or password');
        if (!user.isActive)
            throw errors_1.AppError.forbidden('Account is deactivated');
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            throw errors_1.AppError.unauthorized('Invalid email or password');
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        await database_1.prisma.auditLog.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                action: 'LOGIN',
                entityType: 'User',
                entityId: user.id,
            },
        });
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationSlug: user.organization.slug,
        };
        return {
            user: tokenPayload,
            accessToken: generateAccessToken(tokenPayload),
            refreshToken: generateRefreshToken({ id: user.id }),
        };
    },
    async refresh(refreshToken) {
        const payload = verifyToken(refreshToken, config_1.config.jwt.refreshSecret);
        if (!payload)
            throw errors_1.AppError.unauthorized('Invalid or expired refresh token');
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.id },
            include: { organization: true },
        });
        if (!user || !user.isActive)
            throw errors_1.AppError.unauthorized('User not found or inactive');
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationSlug: user.organization.slug,
        };
        return {
            accessToken: generateAccessToken(tokenPayload),
            refreshToken: generateRefreshToken({ id: user.id }),
        };
    },
    async getProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true },
        });
        if (!user)
            throw errors_1.AppError.notFound('User not found');
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            organization: {
                id: user.organization.id,
                name: user.organization.name,
                slug: user.organization.slug,
                currency: user.organization.currency,
                timezone: user.organization.timezone,
            },
        };
    },
    async updateProfile(userId, data) {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data,
            include: { organization: true },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            organization: {
                id: user.organization.id,
                name: user.organization.name,
                slug: user.organization.slug,
                currency: user.organization.currency,
                timezone: user.organization.timezone,
            },
        };
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.passwordHash)
            throw errors_1.AppError.notFound('User not found');
        const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!valid)
            throw errors_1.AppError.unauthorized('Current password is incorrect');
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { message: 'Password updated successfully' };
    },
    async requestPasswordReset(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'If the email exists, a reset link has been sent' };
        const resetToken = generateAccessToken({ id: user.id, purpose: 'password_reset' });
        // resetToken would be sent via email in production
        void resetToken;
        await database_1.prisma.auditLog.create({
            data: { organizationId: user.organizationId, userId: user.id, action: 'PASSWORD_RESET_REQUEST', entityType: 'User', entityId: user.id },
        });
        return { message: 'If the email exists, a reset link has been sent' };
    },
    async resetPassword(token, newPassword) {
        const payload = verifyToken(token, config_1.config.jwt.accessSecret);
        if (!payload || payload.purpose !== 'password_reset')
            throw errors_1.AppError.unauthorized('Invalid or expired reset token');
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({ where: { id: payload.id }, data: { passwordHash } });
        return { message: 'Password reset successfully' };
    },
};
//# sourceMappingURL=auth.service.js.map