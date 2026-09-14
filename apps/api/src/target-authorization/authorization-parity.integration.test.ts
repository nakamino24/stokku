import { randomUUID } from 'crypto';
import { prisma } from '@stokku/database';
import { authorize } from '@stokku/domain';
import { buildAuthorizationContext, warehouseExists } from './prisma-authorization-adapter';
import { expectDivergence, expectParity } from './parity-helpers';
import { mapDenyReasonToHttpError } from './authorization-mapper';
import { assertWarehouseAccess } from '../middleware/warehouseScope';
import { AppError } from '../utils/errors';

jest.setTimeout(60_000);

const databaseUrl = process.env.DATABASE_URL;
const explicitlyRequested = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';
const isProductionUrl =
  Boolean(databaseUrl) &&
  (databaseUrl!.includes('neon.tech') ||
    databaseUrl!.includes('.neon.') ||
    databaseUrl!.includes('amazonaws.com') ||
    databaseUrl!.includes('rds.'));
const isNonProdNode = process.env.NODE_ENV !== 'production';

// Fail-fast: if a run is explicitly requested against a production/Neon URL, refuse.
if (explicitlyRequested && (isProductionUrl || !isNonProdNode)) {
  throw new Error('Refusing to run parity integration test against a production or Neon database');
}

const localDatabaseConfigured =
  explicitlyRequested &&
  Boolean(databaseUrl) &&
  (databaseUrl!.includes('localhost') || databaseUrl!.includes('127.0.0.1')) &&
  !isProductionUrl;
const describeIfDisposable = localDatabaseConfigured ? describe : describe.skip;

describeIfDisposable('Gate 5 authorization parity (disposable PostgreSQL)', () => {
  const suffix = randomUUID().split('-')[0];
  let userId: string;
  let orgId: string;
  let warehouseAId: string;
  let warehouseBId: string;
  let membershipId: string;

  beforeAll(async () => {
    // Defense-in-depth: never against Neon or production
    if (isProductionUrl) throw new Error('Refusing to run parity test against production database');

    const org = await prisma.organization.create({
      data: {
        name: `Parity Test Org ${suffix}`,
        slug: `parity-test-${suffix}`,
        currency: 'USD',
        timezone: 'UTC',
        isActive: true,
      },
    });
    orgId = org.id;

    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: `parity-staff-${suffix}@test.local`,
        name: 'Parity Tester',
        role: 'WAREHOUSE_STAFF',
        emailVerified: true,
        isActive: true,
      },
    });
    userId = user.id;

    await prisma.organization.update({ where: { id: orgId }, data: { ownerId: userId } });

    const wA = await prisma.warehouse.create({
      data: {
        organizationId: orgId,
        name: `Warehouse A ${suffix}`,
        code: `WA-${suffix}`,
        isActive: true,
      },
    });
    warehouseAId = wA.id;

    const wB = await prisma.warehouse.create({
      data: {
        organizationId: orgId,
        name: `Warehouse B ${suffix}`,
        code: `WB-${suffix}`,
        isActive: true,
      },
    });
    warehouseBId = wB.id;

    // Create a system role with inventory.read plus a '*' wildcard so the reference
    // path mirrors the custom-role behavior documented in ADR-0017 scenario 5.
    const systemRole = await prisma.role.create({
      data: {
        organizationId: orgId,
        name: 'Warehouse Staff',
        slug: 'warehouse_staff',
        isSystem: true,
        permissions: { create: [{ permission: 'inventory.read' }, { permission: '*' }] },
      },
    });

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId,
        role: 'WAREHOUSE_STAFF',
        roleId: systemRole.id,
        warehouseAssignments: {
          create: [{ warehouseId: warehouseAId }],
        },
      },
      include: { warehouseAssignments: true },
    });
    membershipId = membership.id;

    // Create a refresh session so the adapter session defense-in-depth check succeeds
    await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: `token-hash-${suffix}`,
        familyId: `family-${suffix}`,
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    });
  });

  afterAll(async () => {
    // Cleanup: reverse create order
    if (membershipId) {
      await prisma.organizationMemberWarehouse.deleteMany({ where: { organizationMemberId: membershipId } });
      await prisma.organizationMember.delete({ where: { id: membershipId } }).catch(() => {});
    }
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (warehouseAId) await prisma.warehouse.delete({ where: { id: warehouseAId } }).catch(() => {});
    if (warehouseBId) await prisma.warehouse.delete({ where: { id: warehouseBId } }).catch(() => {});
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('scenario 1: same tenant, assigned warehouse, valid permission — both allow', async () => {
    const referenceAllowed = await referenceDecision(orgId, userId, warehouseAId, 'inventory.read');
    const targetAllowed = await targetDecision(orgId, userId, warehouseAId, 'inventory.read');
    expectParity('assigned-warehouse', referenceAllowed, targetAllowed);
  });

  it('scenario 2: cross-tenant organization selector — both deny', async () => {
    const otherOrgId = '00000000-0000-4000-8000-000000000002';
    const reference = await referenceDecision(otherOrgId, userId, warehouseAId, 'inventory.read');
    const target = await targetDecision(otherOrgId, userId, warehouseAId, 'inventory.read');
    expectParity('cross-tenant-selector', reference, target);
  });

  it('scenario 3: unassigned warehouse — both deny', async () => {
    const reference = await referenceDecision(orgId, userId, warehouseBId, 'inventory.read');
    const target = await targetDecision(orgId, userId, warehouseBId, 'inventory.read');
    expectParity('unassigned-warehouse', reference, target);
  });

  it('scenario 4: inactive membership — both deny', async () => {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    const reference = await referenceDecision(orgId, userId, warehouseAId, 'inventory.read');
    const target = await targetDecision(orgId, userId, warehouseAId, 'inventory.read');
    expectParity('inactive-membership', reference, target);
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  });

  it('scenario 5: unknown permission — target denies, reference may allow (expected divergence)', async () => {
    const referenceBehavior = await referenceDecision(orgId, userId, warehouseAId, 'system.root');
    const targetDecisionResult = await targetDecision(orgId, userId, warehouseAId, 'system.root');
    expectDivergence({
      name: 'unknown-permission',
      referenceBehavior: { ...referenceBehavior, reason: undefined },
      reference: referenceBehavior,
      documentedDenyReason: 'UNKNOWN_PERMISSION',
      target: {
        allowed: targetDecisionResult.allowed,
        status: targetDecisionResult.status ?? 500,
        reason: targetDecisionResult.reason!,
      },
      justification: 'target requires finite permission allowlist; reference may grant via custom role wildcard',
    });
  });

  it('scenario 6: owner without warehouse assignment — target denies, reference may allow (expected divergence)', async () => {
    // Create owner user with same org but no warehouse assignment
    const ownerUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: `parity-owner-${suffix}@test.local`,
        name: 'Parity Owner',
        role: 'OWNER',
        emailVerified: true,
        isActive: true,
      },
    });
    const ownerSystemRole = await prisma.role.findFirst({
      where: { organizationId: orgId, slug: 'owner' },
    });
    let ownerRoleId = ownerSystemRole?.id;
    if (!ownerRoleId) {
      const r = await prisma.role.create({
        data: {
          organizationId: orgId,
          name: 'Owner',
          slug: 'owner',
          isSystem: true,
          permissions: { create: [{ permission: 'inventory.read' }] },
        },
      });
      ownerRoleId = r.id;
    }
    const ownerMembership = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: ownerUser.id,
        role: 'OWNER',
        roleId: ownerRoleId,
        // deliberately no warehouseAssignments
      },
    });
    const ownerRefresh = await prisma.refreshSession.create({
      data: {
        userId: ownerUser.id,
        tokenHash: `owner-token-${suffix}`,
        familyId: `owner-family-${suffix}`,
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    });

    const referenceBehavior = await referenceDecision(orgId, ownerUser.id, warehouseAId, 'inventory.read');
    const targetBehavior = await targetDecision(orgId, ownerUser.id, warehouseAId, 'inventory.read');
    expectDivergence({
      name: 'owner-without-warehouse-assignment',
      referenceBehavior: { ...referenceBehavior, reason: undefined },
      reference: referenceBehavior,
      documentedDenyReason: 'WAREHOUSE_SCOPE_REQUIRED',
      target: {
        allowed: targetBehavior.allowed,
        status: targetBehavior.status ?? 500,
        reason: targetBehavior.reason!,
      },
      justification: 'gate-5 interim rule: OWNER/ADMIN do not receive implicit organization-wide warehouse access',
    });

    // Cleanup owner
    await prisma.refreshSession.delete({ where: { id: ownerRefresh.id } }).catch(() => {});
    await prisma.organizationMember.delete({ where: { id: ownerMembership.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
  });

  /**
   * Reference decision: exercise actual reference functions directly against the disposable DB.
   */
  async function referenceDecision(
    organizationId: string,
    userId: string,
    warehouseId: string,
    permission: string,
  ): Promise<{ allowed: boolean; status?: number; reason?: string }> {
    try {
      await assertWarehouseAccess(prisma, organizationId, userId, warehouseId);
      // Permission check via reference rbac path: lookup system role row for the membership role
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          user: { isActive: true, emailVerified: true },
        },
        include: {
          assignedRole: {
            include: { permissions: { where: { permission: { in: [permission, '*'] } } } },
          },
        },
      });
      if (!membership) throw AppError.forbidden('Organization membership required');
      const granted =
        membership.assignedRole?.permissions.some((p) => p.permission === permission || p.permission === '*');
      if (granted) return { allowed: true, status: 200 };
      const systemRole = await prisma.role.findFirst({
        where: {
          organizationId,
          slug: membership.role.toLowerCase(),
          permissions: { some: { permission: { in: [permission, '*'] } } },
        },
      });
      if (systemRole) return { allowed: true, status: 200 };
      return { allowed: false, status: 403 };
    } catch (err) {
      if (err instanceof AppError) return { allowed: false, status: err.statusCode, reason: err.message };
      return { allowed: false, status: 500 };
    }
  }

  /**
   * Target decision: exercise the adapter + domain authorize() directly against the disposable DB.
   */
  async function targetDecision(
    organizationId: string,
    userId: string,
    warehouseId: string,
    permission: string,
  ): Promise<{ allowed: boolean; status?: number; reason?: string }> {
    const context = await buildAuthorizationContext({ userId, organizationId });
    if (!context) return { allowed: false, status: 403, reason: 'MEMBERSHIP_REQUIRED' };

    const exists = await warehouseExists(organizationId, warehouseId);
    if (!exists) return { allowed: false, status: 404, reason: 'NOT_FOUND' };

    const decision = authorize(context, { organizationId, permission, warehouseId }, new Date());
    if (decision.outcome === 'allow') return { allowed: true, status: 200 };
    return { allowed: false, status: mapDenyReasonToHttpError(decision.reason).statusCode, reason: decision.reason };
  }
});
