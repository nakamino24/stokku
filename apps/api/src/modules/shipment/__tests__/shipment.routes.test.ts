import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  post: jest.fn(),
  voidShipment: jest.fn(),
};

jest.mock('../shipment.service', () => ({ ShipmentService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Shipment API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/shipment', jest.requireActual('../shipment.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lists shipment tasks for the active warehouse scope', async () => {
    mockService.list.mockResolvedValue({ data: [{ id: UUID, status: 'READY' }], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/shipment').query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(mockService.list).toHaveBeenCalledWith('org-1', 'user-1', expect.any(Object));
  });

  it('posts a shipment for a packed order', async () => {
    mockService.post.mockResolvedValue({ id: UUID, status: 'SHIPPED' });

    const response = await request(app)
      .post(`/api/v1/shipment/${UUID}/post`)
      .send({ trackingNumber: 'UPS-1024', carrier: 'UPS', note: 'Left at front desk' });

    expect(response.status).toBe(200);
    expect(mockService.post).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      trackingNumber: 'UPS-1024',
      carrier: 'UPS',
      note: 'Left at front desk',
    }));
  });
});
