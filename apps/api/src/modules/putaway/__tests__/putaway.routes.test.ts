import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  claim: jest.fn(),
  complete: jest.fn(),
  exception: jest.fn(),
};

jest.mock('../putaway.service', () => ({ PutawayService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Putaway API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/putaway', jest.requireActual('../putaway.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lists ready tasks for the warehouse scope', async () => {
    mockService.list.mockResolvedValue({ data: [{ id: UUID, status: 'READY' }], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/putaway').query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(mockService.list).toHaveBeenCalledWith('org-1', 'user-1', expect.any(Object));
  });

  it('claims a putaway task', async () => {
    mockService.claim.mockResolvedValue({ id: UUID, status: 'CLAIMED' });

    const response = await request(app).post(`/api/v1/putaway/${UUID}/claim`);

    expect(response.status).toBe(200);
    expect(mockService.claim).toHaveBeenCalledWith('org-1', 'user-1', UUID);
  });

  it('completes a putaway task with a confirmed destination bin', async () => {
    mockService.complete.mockResolvedValue({ id: UUID, status: 'COMPLETED' });

    const response = await request(app)
      .post(`/api/v1/putaway/${UUID}/complete`)
      .send({ destinationBinId: 'bin-123', note: 'Moved to reserve zone' });

    expect(response.status).toBe(200);
    expect(mockService.complete).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      destinationBinId: 'bin-123',
      note: 'Moved to reserve zone',
    }));
  });
});
