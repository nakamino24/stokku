import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const WH_UUID = '550e8400-e29b-41d4-a716-446655440001';
const PO_ITEM_UUID = '550e8400-e29b-41d4-a716-446655440002';

jest.mock('@stokku/database', () => ({
  prisma: {
    purchaseOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrderItem: { update: jest.fn() },
    stockLevel: { upsert: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    stockMovement: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../config', () => ({
  config: { jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' }, cors: { origins: ['http://localhost:3000'] }, port: 3001, nodeEnv: 'test' },
}));

jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

describe('Purchase Orders API', () => {
  let app: ReturnType<typeof createTestApp>;
  const { prisma } = jest.requireMock('@stokku/database');

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp((app) => {
      const routes = jest.requireActual('../purchase-orders.routes').default;
      app.use('/api/v1/purchase-orders', routes);
    });
  });

  it('GET /api/v1/purchase-orders should list', async () => {
    (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([{ id: 'po-1', poNumber: 'PO-00001', items: [] }]);
    (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/v1/purchase-orders');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/purchase-orders should create', async () => {
    (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
    (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue({ id: 'po-1', poNumber: 'PO-00001', items: [] });

    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .send({ supplierId: UUID, items: [{ productId: UUID, quantity: 10, unitPrice: 10 }] });

    expect(res.status).toBe(201);
  });

  it('POST /api/v1/purchase-orders should 400 without items', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .send({ supplierId: UUID, items: [] });

    expect(res.status).toBe(400);
  });

  it('PATCH /:id/status should transition', async () => {
    (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'DRAFT' });
    (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'PENDING_APPROVAL' });

    const res = await request(app)
      .patch('/api/v1/purchase-orders/po-1/status')
      .send({ status: 'PENDING_APPROVAL' });

    expect(res.status).toBe(200);
  });

  it('PATCH /:id/status should reject invalid transition', async () => {
    (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'DRAFT' });

    const res = await request(app)
      .patch('/api/v1/purchase-orders/po-1/status')
      .send({ status: 'RECEIVED' });

    expect(res.status).toBe(400);
  });

  it('POST /:id/receive should receive stock', async () => {
    (prisma.$transaction as jest.Mock).mockImplementation((fn: any) => fn({
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'po-1', poNumber: 'PO-00001', status: 'SENT',
          items: [{ id: PO_ITEM_UUID, productId: UUID, variantId: null, quantity: 10, receivedQty: 0 }],
        }),
        update: jest.fn().mockResolvedValue({ id: 'po-1' }),
      },
      purchaseOrderItem: { update: jest.fn() },
      stockLevel: { upsert: jest.fn().mockResolvedValue({ id: 'sl-1', quantity: 10, available: 10 }), update: jest.fn() },
      stockMovement: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    }));

    const res = await request(app)
      .post('/api/v1/purchase-orders/po-1/receive')
      .send({ warehouseId: WH_UUID, items: [{ itemId: PO_ITEM_UUID, receivedQty: 10 }] });

    expect(res.status).toBe(200);
  });

  it('POST /:id/receive should 400 without warehouseId', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders/po-1/receive')
      .send({ items: [{ itemId: PO_ITEM_UUID, receivedQty: 10 }] });

    expect(res.status).toBe(400);
  });
});
