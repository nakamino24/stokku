import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  create: jest.fn(),
  approve: jest.fn(),
  complete: jest.fn(),
};

jest.mock('../returns.service', () => ({ ReturnsService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Returns API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/returns', jest.requireActual('../returns.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lists return requests for the active warehouse scope', async () => {
    mockService.list.mockResolvedValue({ data: [{ id: UUID, status: 'OPEN' }], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/returns').query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(mockService.list).toHaveBeenCalledWith('org-1', 'user-1', expect.any(Object));
  });

  it('creates a return request', async () => {
    mockService.create.mockResolvedValue({ id: UUID, status: 'OPEN' });

    const response = await request(app)
      .post('/api/v1/returns')
      .send({ salesOrderId: UUID, reason: 'Damaged on arrival', quantity: '2.0', warehouseId: UUID });

    expect(response.status).toBe(201);
    expect(mockService.create).toHaveBeenCalledWith('org-1', 'user-1', expect.objectContaining({
      salesOrderId: UUID,
      reason: 'Damaged on arrival',
      quantity: '2.0',
      warehouseId: UUID,
    }));
  });

  it('approves a return request', async () => {
    mockService.approve.mockResolvedValue({ id: UUID, status: 'APPROVED' });

    const response = await request(app)
      .post(`/api/v1/returns/${UUID}/approve`)
      .send({ approved: true, note: 'Approved for restock' });

    expect(response.status).toBe(200);
    expect(mockService.approve).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      approved: true,
      note: 'Approved for restock',
    }));
  });
});
