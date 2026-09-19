import { prisma, OrganizationRole } from '@stokku/database';
import {
  type AuthorizationContext,
  type IdentityPrincipal,
  type SessionClaim,
  type OrganizationMembership,
  type WarehouseScope,
} from '@stokku/domain';

/**
 * Adapts Prisma persistence layer to target authorization domain types.
 * Based on ADR-0017 field-level mapping table.
 * 
 * Safety: Fail-closed for all missing or invalid data.
 */

export type PrismaAuthorizationInput = {
  userId: string;
  organizationId: string;
  sessionId?: string;
};

/**
 * Builds target AuthorizationContext from Prisma User, OrganizationMember, and related entities.
 * 
 * IMPORTANT: req.user does NOT include User.isActive. This adapter re-queries User to obtain isActive.
 * Reference authMiddleware filters isActive:true then discards the flag.
 * 
 * @param input - userId and organizationId from validated request
 * @returns AuthorizationContext or null if membership does not exist
 */
export async function buildAuthorizationContext(
  input: PrismaAuthorizationInput
): Promise<AuthorizationContext | null> {
  const { userId, organizationId, sessionId } = input;

  // Re-query User to obtain isActive (not available in req.user)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user) return null;

  const identity: IdentityPrincipal = {
    identityId: user.id,
    status: user.isActive ? 'active' : 'inactive',
    emailVerified: user.emailVerified,
  };

  const refreshSession = sessionId
    ? await prisma.refreshSession.findFirst({
        where: { userId, id: sessionId },
        select: {
          id: true,
          expiresAt: true,
          revokedAt: true,
        },
      })
    : await prisma.refreshSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          expiresAt: true,
          revokedAt: true,
        },
      });

  const session: SessionClaim = refreshSession
    ? {
        sessionId: refreshSession.id,
        status: refreshSession.revokedAt ? 'revoked' : 'active',
        expiresAt: refreshSession.expiresAt.toISOString(),
      }
    : {
        // Fail-closed if no session found
        sessionId: 'unknown',
        status: 'revoked',
        expiresAt: new Date(0).toISOString(),
      };

  // Query membership with organization and role permissions
  const membershipRecord = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
    },
    include: {
      organization: {
        select: {
          isActive: true,
        },
      },
      assignedRole: {
        include: {
          permissions: {
            select: {
              permission: true,
            },
          },
        },
      },
      warehouseAssignments: {
        select: {
          warehouseId: true,
        },
      },
    },
  });

  if (!membershipRecord) return null;

  const permissionGrants = (membershipRecord.assignedRole?.permissions || []).map((p) => p.permission);

  // Gate 5 interim rule: warehouseScope.kind is always 'assigned-warehouses'
  // No organization-wide grant exists in current schema
  const warehouseScope: WarehouseScope = {
    kind: 'assigned-warehouses',
    warehouseIds: membershipRecord.warehouseAssignments.map((wa) => wa.warehouseId),
  };

  const membership: OrganizationMembership = {
    membershipId: membershipRecord.id,
    organizationId: membershipRecord.organizationId,
    identityId: membershipRecord.userId,
    status: user.isActive ? 'active' : 'inactive',
    organizationStatus: membershipRecord.organization.isActive ? 'active' : 'inactive',
    role: membershipRecord.role as OrganizationRole,
    permissionGrants,
    warehouseScope,
  };

  return {
    identity,
    session,
    membership,
  };
}

/**
 * Validates warehouse exists within the organization.
 * Returns true if warehouse exists, false otherwise.
 * 
 * Used for 404 vs 403 distinction per ADR-0017:
 * - Warehouse not found or cross-tenant → 404 NOT_FOUND
 * - Warehouse found but no access → 403 WAREHOUSE_ACCESS_DENIED
 */
export async function warehouseExists(organizationId: string, warehouseId: string): Promise<boolean> {
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: warehouseId,
      organizationId,
    },
    select: { id: true },
  });

  return warehouse !== null;
}
