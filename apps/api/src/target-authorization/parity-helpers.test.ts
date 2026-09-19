import { expectDivergence, expectParity } from './parity-helpers';

describe('parity assertion helpers', () => {
  it('expectParity passes when both allow', () => {
    expect(() => expectParity('s1', { allowed: true }, { allowed: true })).not.toThrow();
  });

  it('expectParity passes when both deny with the same status', () => {
    expect(() =>
      expectParity('s2', { allowed: false, status: 403 }, { allowed: false, status: 403 })
    ).not.toThrow();
  });

  it('expectParity fails when one allows and the other denies', () => {
    expect(() => expectParity('s3', { allowed: true }, { allowed: false })).toThrow();
  });

  it('expectParity fails when deny statuses differ', () => {
    expect(() =>
      expectParity('s4', { allowed: false, status: 404 }, { allowed: false, status: 403 })
    ).toThrow();
  });

  it('expectDivergence passes when reference stays at documented behavior and target denies with documented reason', () => {
    expect(() =>
      expectDivergence({
        name: 'owner-without-assignment',
        referenceBehavior: { allowed: true },
        reference: { allowed: true },
        documentedDenyReason: 'WAREHOUSE_SCOPE_REQUIRED',
        target: { allowed: false, status: 403, reason: 'WAREHOUSE_SCOPE_REQUIRED' },
        justification: 'gate-5 interim rule: no organization-wide scope',
      })
    ).not.toThrow();
  });

  it('expectDivergence fails when the deny reason changes without an ADR mapping update', () => {
    expect(() =>
      expectDivergence({
        name: 'owner-without-assignment',
        referenceBehavior: { allowed: true },
        reference: { allowed: true },
        documentedDenyReason: 'WAREHOUSE_SCOPE_REQUIRED',
        target: { allowed: false, status: 403, reason: 'SOMETHING_NEW' },
        justification: 'gate-5 interim rule',
      })
    ).toThrow();
  });

  it('expectDivergence fails when target regresses to allow', () => {
    expect(() =>
      expectDivergence({
        name: 'unknown-permission',
        referenceBehavior: { allowed: true },
        reference: { allowed: true },
        documentedDenyReason: 'UNKNOWN_PERMISSION',
        target: { allowed: true, status: 200, reason: 'UNKNOWN_PERMISSION' },
        justification: 'allowlist enforcement',
      })
    ).toThrow();
  });

  it('expectDivergence fails when reference converges to deny without ADR update', () => {
    expect(() =>
      expectDivergence({
        name: 'unknown-permission',
        referenceBehavior: { allowed: true },
        reference: { allowed: false, status: 403 },
        documentedDenyReason: 'UNKNOWN_PERMISSION',
        target: { allowed: false, status: 400, reason: 'UNKNOWN_PERMISSION' },
        justification: 'allowlist enforcement',
      })
    ).toThrow();
  });
});