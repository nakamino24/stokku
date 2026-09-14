import { buildAuthorizationContext, warehouseExists } from './prisma-authorization-adapter';
import { prisma } from '@stokku/database';
import { authorize } from '@stokku/domain';
import { mapDenyReasonToHttpError } from './authorization-mapper';

jest.mock('@stokku/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    refreshSession: { findFirst: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    warehouse: { findFirst: jest.fn() },
    auditLog: { create: jest.fn(() => Promise.resolve({})) },
  },
  OrganizationRole: { OWNER: 'OWNER', ADMIN: 'ADMIN' },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const orgId = '00000000-0000-4000-8000-000000000001';
const warehouseA = '00000000-0000-4000-8000-000000000011';
const warehouseB = '00000000-0000-4000-8000-000000000012';
const userId = '00000000-0000-4000-8000-000000000201';
const membershipId = '00000000-0000-4000-8000-000000000101';

function seededContext(overrides: {
  userIsActive?: boolean;
  emailVerified?: boolean;
  sessionRevoked?: boolean;
  sessionExpiresAt?: string;
  membershipExists?: boolean;
  membershipRole?: string;
  organizationActive?: boolean;
  assignedWarehouses?: string[];
  rolePermissions?: string[];
}) {
  const {
    userIsActive = true,
    emailVerified = true,
    sessionRevoked = false,
    sessionExpiresAt = '2099-01-01T00:00:00.000Z',
    membershipExists = true,
    membershipRole = 'WAREHOUSE_STAFF',
    organizationActive = true,
    assignedWarehouses = [warehouseA],
    rolePermissions = ['inventory.read'],
  } = overrides;

  (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: userId,
    email: 'staff@test.com',
    isActive: userIsActive,
    emailVerified,
  });

  (mockedPrisma.refreshSession.findFirst as jest.Mock).mockResolvedValue(
    sessionRevoked
      ? { id: 'session-1', expiresAt: new Date('2099-01-01T00:00:00.000Z'), revokedAt: new Date() }
      : { id: 'session-1', expiresAt: new Date(sessionExpiresAt), revokedAt: null }
  );

  (mockedPrisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(
    membershipExists
      ? {
          id: membershipId,
          organizationId: orgId,
          userId,
          role: membershipRole,
          organization: { isActive: organizationActive },
          assignedRole: { permissions: rolePermissions.map((permission) => ({ permission })) },
          warehouseAssignments: assignedWarehouses.map((warehouseId) => ({ warehouseId })),
        }
      : null
  );

  (mockedPrisma.warehouse.findFirst as jest.Mock).mockResolvedValue(
    assignedWarehouses.includes(warehouseB) ? null : { id: warehouseA }
  );
}

const now = new Date('2026-09-13T00:00:00.000Z');

async function targetDecision(organizationId: string, permission: string, warehouseId?: string) {
  const context = await buildAuthorizationContext({ userId, organizationId });
  if (!context) return { allowed: false, status: 403, reason: 'MEMBERSHIP_REQUIRED' };
  const decision = authorize(context, { organizationId, permission, warehouseId }, now);
  if (decision.outcome === 'allow') return { allowed: true, status: 200 };
  return { allowed: false, status: mapDenyReasonToHttpError(decision.reason).statusCode, reason: decision.reason };
}

describe('prisma authorization adapter (unit)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps an active assigned membership to an allow decision', async () => {
    seededContext({});
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: true, status: 200 });
  });

  it('denies a cross-tenant organization selector', async () => {
    seededContext({});
    const decision = await targetDecision('00000000-0000-4000-8000-000000000002', 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'ORGANIZATION_MISMATCH' });
  });

  it('denies an unassigned warehouse', async () => {
    seededContext({});
    const decision = await targetDecision(orgId, 'inventory.read', warehouseB);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'WAREHOUSE_ACCESS_DENIED' });
  });

  it('denies an inactive membership', async () => {
    seededContext({ userIsActive: false });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'IDENTITY_INACTIVE' });
  });

  it('denies an unverified email even though authMiddleware already blocks it at HTTP level', async () => {
    seededContext({ emailVerified: false });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'EMAIL_NOT_VERIFIED' });
  });

  it('denies a revoked session (fail-closed)', async () => {
    seededContext({ sessionRevoked: true });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 401, reason: 'SESSION_REVOKED' });
  });

  it('fails closed when no refresh session exists', async () => {
    seededContext({});
    (mockedPrisma.refreshSession.findFirst as jest.Mock).mockResolvedValue(null);
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 401, reason: 'SESSION_REVOKED' });
  });

  it('denies a missing membership', async () => {
    seededContext({ membershipExists: false });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'MEMBERSHIP_REQUIRED' });
  });

  it('denies an inactive organization', async () => {
    seededContext({ organizationActive: false });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'ORGANIZATION_INACTIVE' });
  });

  it('denies an unknown permission not in the allowlist', async () => {
    seededContext({});
    const decision = await targetDecision(orgId, 'system.root', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 400, reason: 'UNKNOWN_PERMISSION' });
  });

  it('denies a permission not granted to the role', async () => {
    seededContext({ rolePermissions: ['warehouse.read'] });
    const decision = await targetDecision(orgId, 'audit.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'PERMISSION_DENIED' });
  });

  it('preserves unknown permission grants for domain allowlist rejection', async () => {
    seededContext({ rolePermissions: ['system.root'] });
    const context = await buildAuthorizationContext({ userId, organizationId: orgId });
    expect(context?.membership?.permissionGrants).toEqual(['system.root']);
  });

  it('gate-5 owner interim rule: OWNER without assignment denies (no organization-wide grant)', async () => {
    seededContext({ membershipRole: 'OWNER', assignedWarehouses: [] });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 403, reason: 'WAREHOUSE_SCOPE_REQUIRED' });
  });

  it('denies an expired session', async () => {
    seededContext({ sessionExpiresAt: '2020-01-01T00:00:00.000Z' });
    const decision = await targetDecision(orgId, 'inventory.read', warehouseA);
    expect(decision).toEqual({ allowed: false, status: 401, reason: 'SESSION_EXPIRED' });
  });

  it('returns false from warehouseExists for an unknown or cross-tenant warehouse', async () => {
    seededContext({});
    (mockedPrisma.warehouse.findFirst as jest.Mock).mockResolvedValue(null);
    const exists = await warehouseExists(orgId, warehouseB);
    expect(exists).toBe(false);
  });
});