import express, { Express } from 'express';
import { errorHandler } from '../middleware/errorHandler';

export function createTestApp(routes: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  routes(app);
  app.use(errorHandler);
  return app;
}

export const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  organizationId: 'org-1',
  organizationSlug: 'test-org',
};

export function mockAuthMiddleware(req: any, _res: any, next: any) {
  req.user = mockUser;
  next();
}

export function mockOwnerMiddleware(req: any, _res: any, next: any) {
  req.user = { ...mockUser, role: 'OWNER' };
  next();
}
