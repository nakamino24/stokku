import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

jest.mock('@stokku/database', () => ({
  prisma: {
    supplier: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('../../../config', () => ({
  config: { jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiresIn: '15m', refreshExpiresIn: '7d' }, cors: { origins: ['http://localhost:3000'] }, port: 3001, nodeEnv: 'test' },
}));

jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

describe('Suppliers API', () => {
  let app: ReturnType<typeof createTestApp>;
  const { prisma } = jest.requireMock('@stokku/database');

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp((app) => {
      const routes = jest.requireActual('../suppliers.routes').default;
      app.use('/api/v1/suppliers', routes);
    });
  });

  it('should list suppliers', async () => {
    (prisma.supplier.findMany as jest.Mock).mockResolvedValue([{ id: 'sup-1', name: 'Test Supplier' }]);
    (prisma.supplier.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/v1/suppliers');
    expect(res.status).toBe(200);
  });

  it('should create a supplier', async () => {
    (prisma.supplier.create as jest.Mock).mockResolvedValue({ id: 'sup-1', name: 'New Supplier' });

    const res = await request(app)
      .post('/api/v1/suppliers')
      .send({ name: 'New Supplier', email: 'supplier@test.com' });

    expect(res.status).toBe(201);
  });

  it('should reject supplier without name', async () => {
    const res = await request(app)
      .post('/api/v1/suppliers')
      .send({ email: 'supplier@test.com' });

    expect(res.status).toBe(400);
  });

  it('should update a supplier', async () => {
    (prisma.supplier.findFirst as jest.Mock).mockResolvedValue({ id: 'sup-1', organizationId: 'org-1' });
    (prisma.supplier.update as jest.Mock).mockResolvedValue({ id: 'sup-1', name: 'Updated' });

    const res = await request(app)
      .put('/api/v1/suppliers/sup-1')
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
  });

  it('should delete a supplier', async () => {
    (prisma.supplier.findFirst as jest.Mock).mockResolvedValue({ id: 'sup-1', organizationId: 'org-1' });
    (prisma.supplier.delete as jest.Mock).mockResolvedValue({});

    const res = await request(app).delete('/api/v1/suppliers/sup-1');
    expect(res.status).toBe(204);
  });
});
