import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../products.service', () => ({ ProductService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Products API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/products', jest.requireActual('../products.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('accepts exact decimal product values', async () => {
    mockService.create.mockResolvedValue({ id: UUID, name: 'Liquid', unitPrice: '10.125' });
    const response = await request(app).post('/api/v1/products').send({
      name: 'Liquid', unitPrice: '10.125', costPrice: '3.000001', unit: 'l',
    });
    expect(response.status).toBe(201);
    expect(mockService.create).toHaveBeenCalled();
  });

  it('passes variant ids through updates so identities remain stable', async () => {
    mockService.update.mockResolvedValue({ id: UUID, variants: [] });
    const response = await request(app).put(`/api/v1/products/${UUID}`).send({
      variants: [{ id: UUID, name: 'Existing', unitPrice: '1', costPrice: '1' }],
    });
    expect(response.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('org-1', 'user-1', UUID, expect.objectContaining({
      variants: [expect.objectContaining({ id: UUID })],
    }));
  });
});
