import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const SECOND_UUID = '550e8400-e29b-41d4-a716-446655440001';
const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  receive: jest.fn(),
};

jest.mock('../purchase-orders.service', () => ({ PurchaseOrderService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermissionFromRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Purchase Orders API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/purchase-orders', jest.requireActual('../purchase-orders.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('does not expose manual receiving states', async () => {
    const response = await request(app).patch(`/api/v1/purchase-orders/${UUID}/status`).send({ status: 'RECEIVED' });
    expect(response.status).toBe(400);
    expect(mockService.updateStatus).not.toHaveBeenCalled();
  });

  it('requires an idempotency key for receiving', async () => {
    mockService.receive.mockResolvedValue({ id: UUID, status: 'POSTED' });
    const body = { warehouseId: UUID, items: [{ itemId: SECOND_UUID, receivedQty: '12.5' }] };
    const missing = await request(app).post(`/api/v1/purchase-orders/${UUID}/receive`).send(body);
    expect(missing.status).toBe(400);

    const posted = await request(app)
      .post(`/api/v1/purchase-orders/${UUID}/receive`)
      .set('Idempotency-Key', 'receipt-command-1')
      .send(body);
    expect(posted.status).toBe(201);
    expect(mockService.receive).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      idempotencyKey: 'receipt-command-1',
    }));
  });
});
