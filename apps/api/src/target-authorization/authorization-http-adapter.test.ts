import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import { checkAuthorizationHandler } from './authorization-http-adapter';
import { errorHandler } from '../middleware/errorHandler';
import { prisma } from '@stokku/database';
import type { AuthRequest } from '../utils/types';
import type { AuthorizationContext } from '@stokku/domain';

jest.mock('@stokku/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    refreshSession: { findFirst: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    warehouse: { findFirst: jest.fn() },
    auditLog: { create: jest.fn(() => Promise.resolve({})) },
  },
}));

jest.mock('./prisma-authorization-adapter', () => ({
  buildAuthorizationContext: jest.fn(),
  warehouseExists: jest.fn(),
}));

jest.mock('./authorization-audit', () => ({
  extractAuditContext: jest.fn(() => ({ ipAddress: '127.0.0.1', userAgent: 'test' })),
  logAuthorizationDecision: jest.fn(),
}));

import { buildAuthorizationContext, warehouseExists } from './prisma-authorization-adapter';
import { logAuthorizationDecision } from './authorization-audit';

const mockedBuildContext = buildAuthorizationContext as jest.MockedFunction<typeof buildAuthorizationContext>;
const mockedWarehouseExists = warehouseExists as jest.MockedFunction<typeof warehouseExists>;

const orgId = '00000000-0000-4000-8000-000000000001';
const warehouseA = '00000000-0000-4000-8000-000000000011';
const userId = '00000000-0000-4000-8000-000000000201';

function mockAuth(req: Request, _res: Response, next: () => void) {
  (req as AuthRequest).user = {
    id: userId,
    email: 'staff@test.com',
    name: 'Staff',
    role: 'WAREHOUSE_STAFF',
    organizationId: orgId,
    organizationSlug: 'test-org',
    sessionId: 'session-1',
    emailVerified: true,
  };
  next();
}

function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.post('/api/v1/_parity/authorization/check', mockAuth, checkAuthorizationHandler);
  app.use(errorHandler);
  return app;
}

const validContext: AuthorizationContext = {
  identity: { identityId: userId, status: 'active', emailVerified: true },
  session: { sessionId: 'session-1', status: 'active', expiresAt: '2099-01-01T00:00:00.000Z' },
  membership: {
    membershipId: 'membership-1',
    organizationId: orgId,
    identityId: userId,
    status: 'active',
    organizationStatus: 'active',
    role: 'WAREHOUSE_STAFF',
    permissionGrants: [],
    warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [warehouseA] },
  },
};

describe('authorization HTTP adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
  });

  it('returns 404 NOT_FOUND for a missing/cross-tenant warehouse (no existence leak)', async () => {
    mockedWarehouseExists.mockResolvedValue(false);
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: '00000000-0000-4000-8000-000000000099', permission: 'inventory.read' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 VALIDATION_FAILED for an unknown permission', async () => {
    mockedWarehouseExists.mockResolvedValue(true);
    mockedBuildContext.mockResolvedValue(validContext);
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: warehouseA, permission: 'system.root' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 200 with allowed true and writes an allow audit entry', async () => {
    mockedWarehouseExists.mockResolvedValue(true);
    mockedBuildContext.mockResolvedValue(validContext);
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: warehouseA, permission: 'inventory.read' });

    expect(response.status).toBe(200);
    expect(response.body.allowed).toBe(true);
    expect(logAuthorizationDecision).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'allow', denyReason: undefined })
    );
  });

  it('returns deny reason code and writes a deny audit entry (no sensitive details)', async () => {
    mockedWarehouseExists.mockResolvedValue(true);
    mockedBuildContext.mockResolvedValue({
      ...validContext,
      membership: {
        ...validContext.membership!,
        warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [] },
      },
    });
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: warehouseA, permission: 'inventory.read' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.body.error.message).toBe('Warehouse access required but no assignments exist');
    expect(logAuthorizationDecision).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'deny', denyReason: 'WAREHOUSE_SCOPE_REQUIRED' })
    );
    expect(JSON.stringify(response.body.error)).not.toMatch(/password|token|cookie|secret/i);
  });

  it('returns 403 MEMBERSHIP_REQUIRED when no membership exists', async () => {
    mockedWarehouseExists.mockResolvedValue(true);
    mockedBuildContext.mockResolvedValue(null);
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: warehouseA, permission: 'inventory.read' });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Organization membership required');
  });

  it('fails closed before checking permission when the session is revoked', async () => {
    mockedWarehouseExists.mockResolvedValue(true);
    mockedBuildContext.mockResolvedValue({
      ...validContext,
      identity: { ...validContext.identity, status: 'active' },
      session: { ...validContext.session, status: 'revoked' },
    });
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: orgId, warehouseId: warehouseA, permission: 'inventory.read' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(logAuthorizationDecision).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'deny', denyReason: 'SESSION_REVOKED' })
    );
  });
});