"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../../../__tests__/helpers");
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
        auditLog: { create: jest.fn() },
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
        jwt: { accessSecret: 'test-access-secret', refreshSecret: 'test-refresh-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
        cors: { origins: ['http://localhost:3000'] },
        port: 3001,
        nodeEnv: 'test',
    },
}));
jest.mock('../../../middleware/auth', () => ({
    authMiddleware: (req, _res, next) => {
        req.user = { id: 'user-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', organizationId: 'org-1', organizationSlug: 'test-org' };
        next();
    },
}));
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());
describe('POST /auth/register', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    const bcrypt = jest.requireMock('bcryptjs');
    const jwt = jest.requireMock('jsonwebtoken');
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation((fn) => {
            const tx = {
                organization: { create: prisma.organization.create, update: prisma.organization.update },
                user: { create: prisma.user.create, findUnique: prisma.user.findUnique },
                auditLog: { create: prisma.auditLog.create },
            };
            return Promise.resolve(fn(tx));
        });
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../auth.routes').default;
            app.use('/api/v1/auth', routes);
        });
    });
    it('should return 201 and tokens on successful registration', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed');
        prisma.organization.create.mockResolvedValue({ id: 'org-1', slug: 'new-org' });
        prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'new@test.com', name: 'New', role: 'OWNER', organizationId: 'org-1' });
        jwt.sign.mockReturnValue('mock-token');
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({ email: 'new@test.com', password: 'Password1', name: 'New User', organizationName: 'New Org' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
    });
    it('should return 409 for duplicate email', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({ email: 'existing@test.com', password: 'Password1', name: 'Existing', organizationName: 'Org' });
        expect(res.status).toBe(409);
    });
    it('should return 400 for invalid input', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send({ email: 'not-an-email', password: 'short', name: '', organizationName: '' });
        expect(res.status).toBe(400);
    });
});
describe('POST /auth/login', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    const bcrypt = jest.requireMock('bcryptjs');
    const jwt = jest.requireMock('jsonwebtoken');
    beforeEach(() => {
        jest.clearAllMocks();
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../auth.routes').default;
            app.use('/api/v1/auth', routes);
        });
    });
    it('should return 200 and tokens on valid login', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-1', email: 'demo@test.com', name: 'Demo', passwordHash: 'hash',
            isActive: true, role: 'ADMIN', organizationId: 'org-1',
            organization: { slug: 'demo-org' },
        });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token');
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/login')
            .send({ email: 'demo@test.com', password: 'password' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });
    it('should return 401 for wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-1', email: 'demo@test.com', name: 'Demo', passwordHash: 'hash',
            isActive: true, role: 'ADMIN', organizationId: 'org-1',
            organization: { slug: 'demo-org' },
        });
        bcrypt.compare.mockResolvedValue(false);
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/login')
            .send({ email: 'demo@test.com', password: 'wrong' });
        expect(res.status).toBe(401);
    });
});
describe('GET /auth/me', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    beforeEach(() => {
        jest.clearAllMocks();
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../auth.routes').default;
            app.use('/api/v1/auth', routes);
        });
    });
    it('should return current user profile', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN',
            phone: null, avatarUrl: null,
            organization: { id: 'org-1', name: 'Test Org', slug: 'test-org', currency: 'USD', timezone: 'UTC' },
        });
        const res = await (0, supertest_1.default)(app).get('/api/v1/auth/me');
        expect(res.status).toBe(200);
        expect(res.body.email).toBe('admin@test.com');
    });
});
//# sourceMappingURL=auth.routes.test.js.map