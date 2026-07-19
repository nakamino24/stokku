"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../auth.service");
const errors_1 = require("../../../utils/errors");
jest.mock('@stokku/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        organization: {
            create: jest.fn(),
            update: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));
jest.mock('../../../config', () => ({
    config: {
        jwt: {
            accessSecret: 'test-access-secret-thats-long-enough',
            refreshSecret: 'test-refresh-secret-thats-long-enough',
            accessExpiresIn: '15m',
            refreshExpiresIn: '7d',
        },
    },
}));
const { prisma } = jest.requireMock('@stokku/database');
function mockTransaction(fn) {
    const tx = {
        user: { create: prisma.user.create, findUnique: prisma.user.findUnique },
        organization: { create: prisma.organization.create, update: prisma.organization.update },
        auditLog: { create: prisma.auditLog.create },
    };
    return Promise.resolve(fn(tx));
}
describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation(mockTransaction);
    });
    describe('register', () => {
        const regData = { email: 'new@user.com', password: 'Password1', name: 'New User', organizationName: 'New Org' };
        it('should create organization and user', async () => {
            bcryptjs_1.default.hash.mockResolvedValue('hashed-password');
            prisma.organization.create.mockResolvedValue({ id: 'org-1', slug: 'new-org-123' });
            prisma.user.create.mockResolvedValue({ id: 'user-1', email: regData.email, name: regData.name, role: 'OWNER' });
            jsonwebtoken_1.default.sign.mockReturnValue('token');
            const result = await auth_service_1.AuthService.register(regData);
            expect(prisma.organization.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ name: 'New Org' }),
            }));
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ email: regData.email, role: 'OWNER' }),
            }));
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe(regData.email);
        });
        it('should throw conflict if email exists', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(auth_service_1.AuthService.register(regData)).rejects.toThrow(errors_1.AppError);
            await expect(auth_service_1.AuthService.register(regData)).rejects.toMatchObject({ statusCode: 409 });
        });
    });
    describe('login', () => {
        const mockUser = {
            id: 'user-1', email: 'demo@test.com', name: 'Demo', passwordHash: 'hash',
            isActive: true, role: 'ADMIN', organizationId: 'org-1',
            organization: { id: 'org-1', slug: 'demo-org' },
        };
        it('should return tokens on successful login', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('token');
            const result = await auth_service_1.AuthService.login('demo@test.com', 'password');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe('demo@test.com');
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'user-1' },
                data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
            }));
        });
        it('should throw unauthorized for wrong password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(false);
            await expect(auth_service_1.AuthService.login('demo@test.com', 'wrong')).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw unauthorized for non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(auth_service_1.AuthService.login('nobody@test.com', 'password')).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw forbidden for inactive user', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
            await expect(auth_service_1.AuthService.login('demo@test.com', 'password')).rejects.toMatchObject({ statusCode: 403 });
        });
    });
    describe('refresh', () => {
        it('should return new tokens for valid refresh token', async () => {
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 'user-1' });
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1', email: 'demo@test.com', name: 'Demo', isActive: true,
                role: 'ADMIN', organizationId: 'org-1',
                organization: { slug: 'demo-org' },
            });
            jsonwebtoken_1.default.sign.mockReturnValue('new-token');
            const result = await auth_service_1.AuthService.refresh('valid-refresh-token');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
        });
        it('should throw unauthorized for invalid token', async () => {
            jsonwebtoken_1.default.verify.mockReturnValue(null);
            await expect(auth_service_1.AuthService.refresh('invalid')).rejects.toMatchObject({ statusCode: 401 });
        });
    });
    describe('changePassword', () => {
        it('should update password when current password matches', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'old-hash' });
            bcryptjs_1.default.compare.mockResolvedValue(true);
            bcryptjs_1.default.hash.mockResolvedValue('new-hash');
            const result = await auth_service_1.AuthService.changePassword('user-1', 'current', 'new-password');
            expect(result.message).toContain('updated');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { passwordHash: 'new-hash' },
            });
        });
        it('should throw unauthorized for wrong current password', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'old-hash' });
            bcryptjs_1.default.compare.mockResolvedValue(false);
            await expect(auth_service_1.AuthService.changePassword('user-1', 'wrong', 'new')).rejects.toMatchObject({ statusCode: 401 });
        });
    });
    describe('getProfile', () => {
        it('should return user profile without passwordHash', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1', email: 'demo@test.com', name: 'Demo', role: 'ADMIN',
                phone: '123', avatarUrl: null, organization: { id: 'org-1', name: 'Org', slug: 'org', currency: 'USD', timezone: 'UTC' },
            });
            const profile = await auth_service_1.AuthService.getProfile('user-1');
            expect(profile).not.toHaveProperty('passwordHash');
            expect(profile.email).toBe('demo@test.com');
            expect(profile.organization.name).toBe('Org');
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map