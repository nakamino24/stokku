import { authorize, evaluateRoleAssignment } from './index'
import type { AuthorizationContext, AuthorizationRequest, OrganizationMembership } from './index'

const now = new Date('2026-09-13T00:00:00.000Z')
const organizationA = '00000000-0000-4000-8000-000000000001'
const organizationB = '00000000-0000-4000-8000-000000000002'
const warehouseA = '00000000-0000-4000-8000-000000000011'
const warehouseB = '00000000-0000-4000-8000-000000000012'

function membership(overrides: Partial<OrganizationMembership> = {}): OrganizationMembership {
  return {
    membershipId: '00000000-0000-4000-8000-000000000101',
    organizationId: organizationA,
    identityId: '00000000-0000-4000-8000-000000000201',
    status: 'active',
    organizationStatus: 'active',
    role: 'WAREHOUSE_STAFF',
    permissionGrants: [],
    warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [warehouseA] },
    ...overrides,
  }
}

function context(overrides: Partial<AuthorizationContext> = {}): AuthorizationContext {
  return {
    identity: {
      identityId: '00000000-0000-4000-8000-000000000201',
      status: 'active',
      emailVerified: true,
    },
    session: {
      sessionId: '00000000-0000-4000-8000-000000000301',
      status: 'active',
      expiresAt: '2026-09-14T00:00:00.000Z',
    },
    membership: membership(),
    ...overrides,
  }
}

function request(overrides: Partial<AuthorizationRequest> = {}): AuthorizationRequest {
  return {
    organizationId: organizationA,
    permission: 'inventory.read',
    warehouseId: warehouseA,
    ...overrides,
  }
}

describe('target authorization boundary', () => {
  it('allows same-tenant access to an assigned warehouse', () => {
    expect(authorize(context(), request(), now)).toEqual({ outcome: 'allow' })
  })

  it('fails closed for a cross-tenant selector', () => {
    expect(authorize(context(), request({ organizationId: organizationB }), now)).toEqual({
      outcome: 'deny',
      reason: 'ORGANIZATION_MISMATCH',
    })
  })

  it('denies an unassigned warehouse', () => {
    expect(authorize(context(), request({ warehouseId: warehouseB }), now)).toEqual({
      outcome: 'deny',
      reason: 'WAREHOUSE_ACCESS_DENIED',
    })
  })

  it('denies a warehouse operation when no assignment exists', () => {
    expect(
      authorize(
        context({ membership: membership({ warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [] } }) }),
        request(),
        now
      )
    ).toEqual({ outcome: 'deny', reason: 'WAREHOUSE_SCOPE_REQUIRED' })
  })

  it('does not infer warehouse-wide access from the owner role', () => {
    expect(
      authorize(
        context({
          membership: membership({
            role: 'OWNER',
            warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [warehouseA] },
          }),
        }),
        request({ warehouseId: warehouseB }),
        now
      )
    ).toEqual({ outcome: 'deny', reason: 'WAREHOUSE_ACCESS_DENIED' })
  })

  it('allows warehouse-wide access only for an explicit scope grant', () => {
    expect(
      authorize(
        context({
          membership: membership({
            role: 'ADMIN',
            warehouseScope: { kind: 'organization-wide', grant: 'explicit' },
          }),
        }),
        request({ warehouseId: warehouseB }),
        now
      )
    ).toEqual({ outcome: 'allow' })
  })

  it('denies inactive membership and revoked sessions', () => {
    expect(authorize(context({ membership: membership({ status: 'inactive' }) }), request(), now)).toEqual({
      outcome: 'deny',
      reason: 'MEMBERSHIP_INACTIVE',
    })
    expect(authorize(context({ session: { ...context().session, status: 'revoked' } }), request(), now)).toEqual({
      outcome: 'deny',
      reason: 'SESSION_REVOKED',
    })
  })

  it('does not allow arbitrary permissions or normal owner promotion', () => {
    expect(authorize(context(), request({ permission: 'system.root' }), now)).toEqual({
      outcome: 'deny',
      reason: 'UNKNOWN_PERMISSION',
    })
    expect(
      evaluateRoleAssignment({
        actor: membership({ role: 'OWNER' }),
        target: membership({
          membershipId: '00000000-0000-4000-8000-000000000102',
          identityId: '00000000-0000-4000-8000-000000000202',
          role: 'VIEWER',
        }),
        requestedRole: 'OWNER',
      })
    ).toEqual({ outcome: 'deny', reason: 'OWNER_ROLE_PROTECTED' })
  })

  it('denies an allowlist-bypassing permission grant', () => {
    expect(
      authorize(
        context({ membership: membership({ permissionGrants: ['system.root' as never] }) }),
        request(),
        now
      )
    ).toEqual({ outcome: 'deny', reason: 'UNKNOWN_PERMISSION_GRANT' })
  })

  it('denies self-promotion and promotion to an equal or higher role', () => {
    const admin = membership({ role: 'ADMIN' })
    expect(
      evaluateRoleAssignment({ actor: admin, target: admin, requestedRole: 'INVENTORY_MANAGER' })
    ).toEqual({ outcome: 'deny', reason: 'SELF_ASSIGNMENT' })
    expect(
      evaluateRoleAssignment({
        actor: admin,
        target: membership({
          membershipId: '00000000-0000-4000-8000-000000000102',
          identityId: '00000000-0000-4000-8000-000000000202',
        }),
        requestedRole: 'ADMIN',
      })
    ).toEqual({ outcome: 'deny', reason: 'INSUFFICIENT_ROLE_AUTHORITY' })
  })

  it('prevents an admin from changing an owner through a normal role command', () => {
    expect(
      evaluateRoleAssignment({
        actor: membership({ role: 'ADMIN' }),
        target: membership({
          membershipId: '00000000-0000-4000-8000-000000000102',
          identityId: '00000000-0000-4000-8000-000000000202',
          role: 'OWNER',
        }),
        requestedRole: 'VIEWER',
      })
    ).toEqual({ outcome: 'deny', reason: 'OWNER_ROLE_PROTECTED' })
  })
})
