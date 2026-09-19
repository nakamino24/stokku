import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const mockService = {
  getSummary: jest.fn(),
  getLowStockAlerts: jest.fn(),
};

jest.mock('../dashboard.service', () => ({ DashboardService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Dashboard API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/dashboard', jest.requireActual('../dashboard.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns a dashboard summary', async () => {
    mockService.getSummary.mockResolvedValue({ stats: { products: 12 }, recentMovements: [] });

    const response = await request(app).get('/api/v1/dashboard');

    expect(response.status).toBe(200);
    expect(mockService.getSummary).toHaveBeenCalledWith('org-1', 'user-1');
  });

  it('returns low stock alerts', async () => {
    mockService.getLowStockAlerts.mockResolvedValue([{ product: { name: 'Widget' } }]);

    const response = await request(app).get('/api/v1/dashboard/low-stock');

    expect(response.status).toBe(200);
    expect(mockService.getLowStockAlerts).toHaveBeenCalledWith('org-1', 'user-1');
  });
});
