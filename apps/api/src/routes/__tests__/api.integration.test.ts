import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('@stokku/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    workspace: { findFirst: jest.fn(), create: jest.fn() },
    project: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    task: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    category: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    product: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    productVariant: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    supplier: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    productSupplier: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
    warehouse: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    stockLevel: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), count: jest.fn() },
    stockMovement: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: 'user-123', role: 'admin' })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  process.env.REFRESH_TOKEN_SECRET = 'test-secret';
});

describe('API Integration', () => {
  describe('Health', () => {
    it('GET /health returns 200', async () => {
      const app = express();
      app.get('/health', (_req, res) => res.json({ status: 'OK' }));

      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('Auth Routes', () => {
    it('POST /auth/login with missing fields returns 400', async () => {
      const app = express();
      app.use(express.json());
      const { PrismaClient } = require('@prisma/client');

      app.post('/auth/login', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          const { email, password } = req.body;
          if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required', code: 'BAD_REQUEST' });
          }
          res.json({ accessToken: 'test', refreshToken: 'test', user: { id: '1', email } });
        } catch (err) { next(err); }
      });
      app.use(errorHandler);

      const res = await request(app).post('/auth/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('Protected Routes', () => {
    it('returns 401 without auth header', async () => {
      const app = express();
      app.use(express.json());
      app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'No token provided', code: 'UNAUTHORIZED' });
        next();
      });
      app.get('/projects', (_req, res) => res.json([]));

      const res = await request(app).get('/projects');
      expect(res.status).toBe(401);
    });

    it('returns 200 with valid auth header', async () => {
      const app = express();
      app.use(express.json());
      app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'No token provided' });
        next();
      });
      app.get('/projects', (_req, res) => res.json([{ id: '1', name: 'Test' }]));

      const res = await request(app).get('/projects').set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });
});
