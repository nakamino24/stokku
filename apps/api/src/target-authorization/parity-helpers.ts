/**
 * Parity assertion helpers for the Gate 5 authorization adapter probe.
 *
 * Per ADR-0017:
 * - Scenarios 1-4 use expectParity(): reference and target must be equivalent.
 * - Scenarios 5-6 use expectDivergence(): divergence is intentional, documented,
 *   and must fail loudly if either side converges/regresses.
 */

export type ParityOutcome = {
  allowed: boolean;
  status?: number;
  reason?: string;
};

/**
 * Asserts reference and target outcomes are equivalent.
 *
 * Fails if:
 * - one allows and the other denies, or
 * - both deny but HTTP status differs.
 */
export function expectParity(name: string, reference: ParityOutcome, target: ParityOutcome): void {
  expect(name.length).toBeGreaterThan(0);
  expect(target.allowed).toBe(reference.allowed);
  if (!reference.allowed) {
    expect(target.status).toBe(reference.status);
    expect(target.reason).toBe(reference.reason);
  }
}

/**
 * Asserts an intentional, documented divergence.
 *
 * Fails if:
 * - `reference` no longer behaves like `referenceBehavior` (convergence without ADR update), or
 * - target regresses to allow, or
 * - target deny `reason` differs from the ADR-0017 documented `documentedDenyReason`.
 */
export function expectDivergence(params: {
  name: string;
  referenceBehavior: ParityOutcome;
  reference: ParityOutcome;
  documentedDenyReason: string;
  target: ParityOutcome & { status: number; reason: string };
  justification: string;
}): void {
  const { name, referenceBehavior, reference, documentedDenyReason, target, justification } = params;
  expect(name.length).toBeGreaterThan(0);
  expect(justification.length).toBeGreaterThan(0);
  expect(reference).toEqual(referenceBehavior);
  expect(target.allowed).toBe(false);
  expect(target.reason).toBe(documentedDenyReason);
  expect(reference.allowed).not.toBe(target.allowed);
}