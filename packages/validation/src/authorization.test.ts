import {
  authorizationContextSchema,
  authorizationRequestSchema,
  roleChangeRequestSchema,
  warehouseScopeSchema,
} from './index'

const ids = {
  identityId: '00000000-0000-4000-8000-000000000201',
  sessionId: '00000000-0000-4000-8000-000000000301',
  membershipId: '00000000-0000-4000-8000-000000000101',
  organizationId: '00000000-0000-4000-8000-000000000001',
  warehouseId: '00000000-0000-4000-8000-000000000011',
}

describe('target authorization validation', () => {
  it('accepts a serializable, bounded context without credentials', () => {
    expect(
      authorizationContextSchema.parse({
        identity: { identityId: ids.identityId, status: 'active', emailVerified: true },
        session: { sessionId: ids.sessionId, status: 'active', expiresAt: '2026-09-14T00:00:00.000Z' },
        membership: {
          membershipId: ids.membershipId,
          organizationId: ids.organizationId,
          identityId: ids.identityId,
          status: 'active',
          organizationStatus: 'active',
          role: 'WAREHOUSE_STAFF',
          permissionGrants: [],
          warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [ids.warehouseId] },
        },
      })
    ).toBeDefined()
  })

  it('accepts raw permission strings and rejects unknown fields, duplicate grant entries, and owner role changes', () => {
    expect(authorizationRequestSchema.parse({ organizationId: ids.organizationId, permission: 'system.root' })).toMatchObject({
      permission: 'system.root',
    })
    expect(() => roleChangeRequestSchema.parse({ role: 'OWNER' })).toThrow()
    expect(() => warehouseScopeSchema.parse({ kind: 'assigned-warehouses', warehouseIds: [ids.warehouseId, ids.warehouseId] })).toThrow()
    expect(() => authorizationContextSchema.parse({
      identity: { identityId: ids.identityId, status: 'active', emailVerified: true },
      session: { sessionId: ids.sessionId, status: 'active', expiresAt: '2026-09-14T00:00:00.000Z' },
      membership: {
        membershipId: ids.membershipId,
        organizationId: ids.organizationId,
        identityId: ids.identityId,
        status: 'active',
        organizationStatus: 'active',
        role: 'VIEWER',
        permissionGrants: ['inventory.read', 'inventory.read'],
        warehouseScope: { kind: 'assigned-warehouses', warehouseIds: [] },
      },
    })).toThrow()
    expect(() => authorizationContextSchema.parse({ identity: {}, session: {}, credential: 'secret' })).toThrow()
  })
})
