import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

jest.mock('../sales-orders.service', () => ({ SalesOrderService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermissionFromRequest: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Sales Orders API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/sales-orders', jest.requireActual('../sales-orders.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('creates a DRAFT command without requiring stock at route level', async () => {
    mockService.create.mockResolvedValue({ id: UUID, status: 'DRAFT' });
    const response = await request(app).post('/api/v1/sales-orders').send({
      customerId: UUID,
      items: [{ productId: UUID, quantity: '0.75', unitPrice: '12.125' }],
    });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('DRAFT');
    expect(mockService.create).toHaveBeenCalledWith('org-1', 'user-1', expect.objectContaining({
      items: [expect.objectContaining({ quantity: '0.75' })],
    }));
  });

  it('rejects an empty order', async () => {
    const response = await request(app).post('/api/v1/sales-orders').send({ customerId: UUID, items: [] });
    expect(response.status).toBe(400);
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('dispatches shipment status through the status command', async () => {
    mockService.updateStatus.mockResolvedValue({ id: UUID, status: 'SHIPPED' });
    const response = await request(app).patch(`/api/v1/sales-orders/${UUID}/status`).send({ status: 'SHIPPED' });
    expect(response.status).toBe(200);
    expect(mockService.updateStatus).toHaveBeenCalledWith('org-1', 'user-1', UUID, 'SHIPPED');
  });
});
