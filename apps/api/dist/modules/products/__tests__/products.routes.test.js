"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../../../__tests__/helpers");
jest.mock('@stokku/database', () => ({
    prisma: {
        product: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        category: { findMany: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock('../../../config', () => ({
    config: {
        jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
        cors: { origins: ['http://localhost:3000'] },
        port: 3001,
        nodeEnv: 'test',
    },
}));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: helpers_1.mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());
const mockProduct = {
    id: 'prod-1', name: 'Test Product', sku: 'TST-001', unitPrice: 45, costPrice: 28,
    unit: 'pcs', isActive: true, status: 'ACTIVE', categoryId: null, category: null,
    description: null, barcode: null, taxRate: 0, minStock: 0, maxStock: null,
    imageUrl: null, weight: null, weightUnit: 'kg',
    variants: [], createdAt: new Date(), updatedAt: new Date(),
};
describe('Products API', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    beforeEach(() => {
        jest.clearAllMocks();
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../products.routes').default;
            app.use('/api/v1/products', routes);
        });
    });
    describe('GET /api/v1/products', () => {
        it('should return paginated products', async () => {
            prisma.product.findMany.mockResolvedValue([mockProduct]);
            prisma.product.count.mockResolvedValue(1);
            const res = await (0, supertest_1.default)(app).get('/api/v1/products');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination).toBeDefined();
        });
    });
    describe('GET /api/v1/products/:id', () => {
        it('should return product by id', async () => {
            prisma.product.findFirst.mockResolvedValue(mockProduct);
            const res = await (0, supertest_1.default)(app).get('/api/v1/products/prod-1');
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Test Product');
        });
        it('should return 404 for non-existent product', async () => {
            prisma.product.findFirst.mockResolvedValue(null);
            const res = await (0, supertest_1.default)(app).get('/api/v1/products/nonexistent');
            expect(res.status).toBe(404);
        });
    });
    describe('POST /api/v1/products', () => {
        it('should create a product', async () => {
            prisma.product.create.mockResolvedValue(mockProduct);
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/products')
                .send({ name: 'Test Product', sku: 'TST-001', unitPrice: 45, unit: 'pcs' });
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Test Product');
        });
        it('should return 400 for missing name', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/products')
                .send({ sku: 'TST-001' });
            expect(res.status).toBe(400);
        });
    });
    describe('PUT /api/v1/products/:id', () => {
        it('should update a product', async () => {
            prisma.product.findFirst.mockResolvedValue(mockProduct);
            prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });
            const res = await (0, supertest_1.default)(app)
                .put('/api/v1/products/prod-1')
                .send({ name: 'Updated' });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Updated');
        });
    });
    describe('DELETE /api/v1/products/:id', () => {
        it('should deactivate a product', async () => {
            prisma.product.findFirst.mockResolvedValue(mockProduct);
            prisma.product.update.mockResolvedValue({ ...mockProduct, isActive: false });
            const res = await (0, supertest_1.default)(app).delete('/api/v1/products/prod-1');
            expect(res.status).toBe(204);
            expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'prod-1' },
                data: expect.objectContaining({ isActive: false }),
            }));
        });
    });
});
//# sourceMappingURL=products.routes.test.js.map