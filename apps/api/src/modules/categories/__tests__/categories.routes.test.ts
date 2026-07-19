import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

jest.mock('@stokku/database', () => ({
  prisma: {
    category: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    product: { count: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('../../../config', () => ({
  config: { jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' }, cors: { origins: ['http://localhost:3000'] }, port: 3001, nodeEnv: 'test' },
}));

jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

describe('Categories API', () => {
  let app: ReturnType<typeof createTestApp>;
  const { prisma } = jest.requireMock('@stokku/database');

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp((app) => {
      const routes = jest.requireActual('../categories.routes').default;
      app.use('/api/v1/categories', routes);
    });
  });

  it('should list categories', async () => {
    (prisma.category.findMany as jest.Mock).mockResolvedValue([{ id: 'cat-1', name: 'Raw Materials' }]);
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
  });

  it('should create a category', async () => {
    (prisma.category.create as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'New Category', slug: 'new-category' });

    const res = await request(app)
      .post('/api/v1/categories')
      .send({ name: 'New Category' });

    expect(res.status).toBe(201);
  });

  it('should reject category without name', async () => {
    const res = await request(app).post('/api/v1/categories').send({});
    expect(res.status).toBe(400);
  });

  it('should update a category', async () => {
    (prisma.category.findFirst as jest.Mock).mockResolvedValue({ id: 'cat-1', organizationId: 'org-1' });
    (prisma.category.update as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'Updated' });

    const res = await request(app)
      .put('/api/v1/categories/cat-1')
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
  });

  it('should delete a category', async () => {
    (prisma.category.findFirst as jest.Mock).mockResolvedValue({
      id: 'cat-1', organizationId: 'org-1', _count: { products: 0 },
    });
    (prisma.category.delete as jest.Mock).mockResolvedValue({});

    const res = await request(app).delete('/api/v1/categories/cat-1');
    expect(res.status).toBe(204);
  });
});
