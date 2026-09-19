import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  claim: jest.fn(),
  confirm: jest.fn(),
  shortPick: jest.fn(),
};

jest.mock('../picking.service', () => ({ PickingService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Picking API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/picking', jest.requireActual('../picking.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lists pick tasks for the active warehouse scope', async () => {
    mockService.list.mockResolvedValue({ data: [{ id: UUID, status: 'READY' }], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/picking').query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(mockService.list).toHaveBeenCalledWith('org-1', 'user-1', expect.any(Object));
  });

  it('claims a pick task', async () => {
    mockService.claim.mockResolvedValue({ id: UUID, status: 'CLAIMED' });

    const response = await request(app).post(`/api/v1/picking/${UUID}/claim`);

    expect(response.status).toBe(200);
    expect(mockService.claim).toHaveBeenCalledWith('org-1', 'user-1', UUID);
  });

  it('confirms a pick task with the picked quantity', async () => {
    mockService.confirm.mockResolvedValue({ id: UUID, status: 'PICKED' });

    const response = await request(app)
      .post(`/api/v1/picking/${UUID}/confirm`)
      .send({ pickedQty: '3.5', note: 'Picked from A-01' });

    expect(response.status).toBe(200);
    expect(mockService.confirm).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      pickedQty: '3.5',
      note: 'Picked from A-01',
    }));
  });
});
