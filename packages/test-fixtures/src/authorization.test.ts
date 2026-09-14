import { buildAuthorizationContext, buildAuthorizationRequest, buildMembership, fixtureIds } from './index'

describe('disposable authorization fixtures', () => {
  it('uses deterministic test IDs and never includes credentials', () => {
    expect(buildAuthorizationContext()).toEqual(
      expect.objectContaining({
        identity: expect.objectContaining({ identityId: fixtureIds.identityA }),
        membership: expect.objectContaining({ organizationId: fixtureIds.organizationA }),
      })
    )
    expect(JSON.stringify(buildAuthorizationContext())).not.toMatch(/password|token|cookie|secret/i)
  })

  it('allows isolated fixture variants without a database', () => {
    expect(buildMembership({ organizationId: fixtureIds.organizationB }).organizationId).toBe(fixtureIds.organizationB)
    expect(buildAuthorizationRequest({ warehouseId: fixtureIds.warehouseB }).warehouseId).toBe(fixtureIds.warehouseB)
  })
})
