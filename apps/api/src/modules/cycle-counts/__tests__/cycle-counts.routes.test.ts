import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  create: jest.fn(),
  execute: jest.fn(),
  approve: jest.fn(),
};

jest.mock('../cycle-counts.service', () => ({ CycleCountService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Cycle Counts API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/cycle-counts', jest.requireActual('../cycle-counts.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('lists cycle counts for the active warehouse scope', async () => {
    mockService.list.mockResolvedValue({ data: [{ id: UUID, status: 'OPEN' }], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/cycle-counts').query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(mockService.list).toHaveBeenCalledWith('org-1', 'user-1', expect.any(Object));
  });

  it('creates a cycle count', async () => {
    mockService.create.mockResolvedValue({ id: UUID, status: 'OPEN' });

    const response = await request(app)
      .post('/api/v1/cycle-counts')
      .send({ warehouseId: UUID, zone: 'A-01', bins: ['BIN-1', 'BIN-2'] });

    expect(response.status).toBe(201);
    expect(mockService.create).toHaveBeenCalledWith('org-1', 'user-1', expect.objectContaining({
      warehouseId: UUID,
      zone: 'A-01',
      bins: ['BIN-1', 'BIN-2'],
    }));
  });

  it('executes a counted bin adjustment', async () => {
    mockService.execute.mockResolvedValue({ id: UUID, status: 'COUNTED' });

    const response = await request(app)
      .post(`/api/v1/cycle-counts/${UUID}/execute`)
      .send({ binId: UUID, countedQty: '12.5', reason: 'Verification count' });

    expect(response.status).toBe(200);
    expect(mockService.execute).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      binId: UUID,
      countedQty: '12.5',
      reason: 'Verification count',
    }));
  });
});
