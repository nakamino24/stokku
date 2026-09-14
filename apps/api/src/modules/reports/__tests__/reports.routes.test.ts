import request from 'supertest';
import { createTestApp, mockAuthMiddleware } from '../../../__tests__/helpers';

const mockService = {
  stockValue: jest.fn(),
  stockMovement: jest.fn(),
  sales: jest.fn(),
  purchasing: jest.fn(),
  inventoryValuation: jest.fn(),
  auditLog: jest.fn(),
};

jest.mock('../reports.service', () => ({ ReportsService: mockService }));
jest.mock('../../../middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
jest.mock('../../../middleware/rbac', () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('Reports API', () => {
  const app = createTestApp((instance) => {
    instance.use('/api/v1/reports', jest.requireActual('../reports.routes').default);
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns stock value summary', async () => {
    mockService.stockValue.mockResolvedValue({ totalCostValue: '100' });

    const response = await request(app).get('/api/v1/reports/stock-value');

    expect(response.status).toBe(200);
    expect(mockService.stockValue).toHaveBeenCalledWith('org-1', 'user-1');
  });

  it('returns inventory movement data with date filters', async () => {
    mockService.stockMovement.mockResolvedValue({ total: 2, movements: [] });

    const response = await request(app)
      .get('/api/v1/reports/stock-movement')
      .query({ startDate: '2026-09-01', endDate: '2026-09-14' });

    expect(response.status).toBe(200);
    expect(mockService.stockMovement).toHaveBeenCalledWith('org-1', 'user-1', '2026-09-01', '2026-09-14');
  });

  it('returns audit log data with pagination', async () => {
    mockService.auditLog.mockResolvedValue({ data: [], pagination: { page: 1, totalPages: 1 } });

    const response = await request(app).get('/api/v1/reports/audit-log').query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(mockService.auditLog).toHaveBeenCalledWith('org-1', expect.any(Object));
  });
});
