"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../../../__tests__/helpers");
jest.mock('@stokku/database', () => ({
    prisma: {
        supplier: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    },
}));
jest.mock('../../../config', () => ({
    config: { jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' }, cors: { origins: ['http://localhost:3000'] }, port: 3001, nodeEnv: 'test' },
}));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: helpers_1.mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());
describe('Suppliers API', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    beforeEach(() => {
        jest.clearAllMocks();
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../suppliers.routes').default;
            app.use('/api/v1/suppliers', routes);
        });
    });
    it('should list suppliers', async () => {
        prisma.supplier.findMany.mockResolvedValue([{ id: 'sup-1', name: 'Test Supplier' }]);
        prisma.supplier.count.mockResolvedValue(1);
        const res = await (0, supertest_1.default)(app).get('/api/v1/suppliers');
        expect(res.status).toBe(200);
    });
    it('should create a supplier', async () => {
        prisma.supplier.create.mockResolvedValue({ id: 'sup-1', name: 'New Supplier' });
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/suppliers')
            .send({ name: 'New Supplier', email: 'supplier@test.com' });
        expect(res.status).toBe(201);
    });
    it('should reject supplier without name', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/suppliers')
            .send({ email: 'supplier@test.com' });
        expect(res.status).toBe(400);
    });
    it('should update a supplier', async () => {
        prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: 'org-1' });
        prisma.supplier.update.mockResolvedValue({ id: 'sup-1', name: 'Updated' });
        const res = await (0, supertest_1.default)(app)
            .put('/api/v1/suppliers/sup-1')
            .send({ name: 'Updated' });
        expect(res.status).toBe(200);
    });
    it('should delete a supplier', async () => {
        prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: 'org-1' });
        prisma.supplier.delete.mockResolvedValue({});
        const res = await (0, supertest_1.default)(app).delete('/api/v1/suppliers/sup-1');
        expect(res.status).toBe(204);
    });
});
//# sourceMappingURL=suppliers.routes.test.js.map