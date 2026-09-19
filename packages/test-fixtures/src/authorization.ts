import type { AuthorizationContext, AuthorizationRequest, OrganizationMembership } from '@stokku/domain'

export const fixtureIds = {
  organizationA: '00000000-0000-4000-8000-000000000001',
  organizationB: '00000000-0000-4000-8000-000000000002',
  warehouseA: '00000000-0000-4000-8000-000000000011',
  warehouseB: '00000000-0000-4000-8000-000000000012',
  identityA: '00000000-0000-4000-8000-000000000201',
  identityB: '00000000-0000-4000-8000-000000000202',
  membershipA: '00000000-0000-4000-8000-000000000101',
  membershipB: '00000000-0000-4000-8000-000000000102',
  sessionA: '00000000-0000-4000-8000-000000000301',
} as const

export function buildMembership(
  overrides: Partial<OrganizationMembership> = {}
): OrganizationMembership {
  return {
    membershipId: fixtureIds.membershipA,
    organizationId: fixtureIds.organizationA,
    identityId: fixtureIds.identityA,
    status: 'active',
    organizationStatus: 'active',
    role: 'WAREHOUSE_STAFF',
    permissionGrants: [],
    warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [fixtureIds.warehouseA] },
    ...overrides,
  }
}

export function buildAuthorizationContext(
  overrides: Partial<AuthorizationContext> = {}
): AuthorizationContext {
  return {
    identity: {
      identityId: fixtureIds.identityA,
      status: 'active',
      emailVerified: true,
    },
    session: {
      sessionId: fixtureIds.sessionA,
      status: 'active',
      expiresAt: '2099-01-01T00:00:00.000Z',
    },
    membership: buildMembership(),
    ...overrides,
  }
}

export function buildAuthorizationRequest(
  overrides: Partial<AuthorizationRequest> = {}
): AuthorizationRequest {
  return {
    organizationId: fixtureIds.organizationA,
    permission: 'inventory.read',
    warehouseId: fixtureIds.warehouseA,
    ...overrides,
  }
}
