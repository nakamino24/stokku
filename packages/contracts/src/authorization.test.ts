import {
  AUTHORIZATION_DENY_CODES,
  authorizationRequestSchema,
  roleChangeRequestSchema,
} from './index'

describe('target authorization contracts', () => {
  it('publishes a finite deny-code and permission contract', () => {
    expect(AUTHORIZATION_DENY_CODES).toContain('ORGANIZATION_MISMATCH')
    expect(AUTHORIZATION_DENY_CODES).not.toContain('INTERNAL_ERROR')
    expect(
      authorizationRequestSchema.safeParse({
        organizationId: '00000000-0000-4000-8000-000000000001',
        permission: 'inventory.read',
      }).success
    ).toBe(true)
  })

  it('does not expose a normal owner-promotion contract', () => {
    expect(roleChangeRequestSchema.safeParse({ role: 'OWNER' }).success).toBe(false)
  })
})
