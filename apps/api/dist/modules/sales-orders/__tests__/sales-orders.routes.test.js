"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../../../__tests__/helpers");
const UUID = '550e8400-e29b-41d4-a716-446655440000';
jest.mock('@stokku/database', () => ({
    prisma: {
        salesOrder: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        salesOrderItem: { findMany: jest.fn() },
        stockLevel: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
        stockMovement: { create: jest.fn() },
        product: { findUnique: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock('../../../config', () => ({
    config: { jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' }, cors: { origins: ['http://localhost:3000'] }, port: 3001, nodeEnv: 'test' },
}));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: helpers_1.mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());
describe('Sales Orders API', () => {
    let app;
    const { prisma } = jest.requireMock('@stokku/database');
    beforeEach(() => {
        jest.clearAllMocks();
        app = (0, helpers_1.createTestApp)((app) => {
            const routes = jest.requireActual('../sales-orders.routes').default;
            app.use('/api/v1/sales-orders', routes);
        });
    });
    it('GET /api/v1/sales-orders should list', async () => {
        prisma.salesOrder.findMany.mockResolvedValue([{ id: 'so-1', items: [] }]);
        prisma.salesOrder.count.mockResolvedValue(1);
        const res = await (0, supertest_1.default)(app).get('/api/v1/sales-orders');
        expect(res.status).toBe(200);
    });
    it('POST /api/v1/sales-orders should create with stock reservation', async () => {
        prisma.salesOrder.count.mockResolvedValue(0);
        prisma.stockLevel.findFirst.mockResolvedValue({ id: 'sl-1', available: 50 });
        prisma.$transaction.mockImplementation((fn) => fn({
            salesOrder: {
                count: prisma.salesOrder.count,
                create: jest.fn().mockResolvedValue({ id: 'so-1', soNumber: 'SO-00001', items: [] }),
            },
            stockLevel: { findFirst: prisma.stockLevel.findFirst, updateMany: prisma.stockLevel.updateMany },
            auditLog: { create: jest.fn() },
        }));
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/sales-orders')
            .send({ customerId: UUID, items: [{ productId: UUID, quantity: 5, unitPrice: 20 }] });
        expect(res.status).toBe(201);
    });
    it('POST /api/v1/sales-orders should reject insufficient stock', async () => {
        prisma.salesOrder.count.mockResolvedValue(0);
        prisma.stockLevel.findFirst.mockResolvedValue({ id: 'sl-1', available: 2 });
        prisma.product.findUnique.mockResolvedValue({ name: 'Test Product' });
        prisma.$transaction.mockImplementation((fn) => fn({
            salesOrder: { count: prisma.salesOrder.count },
            stockLevel: { findFirst: prisma.stockLevel.findFirst },
            product: { findUnique: prisma.product.findUnique },
        }));
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/sales-orders')
            .send({ customerId: UUID, items: [{ productId: UUID, quantity: 5, unitPrice: 20 }] });
        expect(res.status).toBe(400);
    });
    it('POST /api/v1/sales-orders should 400 without items', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/sales-orders')
            .send({ customerId: UUID, items: [] });
        expect(res.status).toBe(400);
    });
    it('PATCH /:id/status should deliver and decrement stock', async () => {
        prisma.salesOrder.findFirst.mockResolvedValue({ id: 'so-1', soNumber: 'SO-00001', status: 'SHIPPING' });
        prisma.salesOrderItem.findMany.mockResolvedValue([{ id: 'so-item-1', productId: UUID, variantId: null, quantity: 5 }]);
        prisma.stockLevel.findFirst.mockResolvedValue({ id: 'sl-1', warehouseId: 'wh-1', quantity: 50, reserved: 5 });
        prisma.$transaction.mockImplementation((fn) => fn({
            salesOrder: {
                findFirst: prisma.salesOrder.findFirst,
                update: jest.fn().mockResolvedValue({ id: 'so-1', status: 'DELIVERED' }),
            },
            salesOrderItem: { findMany: prisma.salesOrderItem.findMany },
            stockLevel: { findFirst: prisma.stockLevel.findFirst, update: prisma.stockLevel.update },
            stockMovement: { create: jest.fn() },
            auditLog: { create: jest.fn() },
        }));
        const res = await (0, supertest_1.default)(app)
            .patch('/api/v1/sales-orders/so-1/status')
            .send({ status: 'DELIVERED' });
        expect(res.status).toBe(200);
    });
    it('PATCH /:id/status should reject invalid transition', async () => {
        prisma.salesOrder.findFirst.mockResolvedValue({ id: 'so-1', status: 'DRAFT' });
        const res = await (0, supertest_1.default)(app)
            .patch('/api/v1/sales-orders/so-1/status')
            .send({ status: 'DELIVERED' });
        expect(res.status).toBe(400);
    });
});
//# sourceMappingURL=sales-orders.routes.test.js.map