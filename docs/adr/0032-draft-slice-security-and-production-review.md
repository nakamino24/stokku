# ADR-0032: Draft Slice Security And Production-Impact Review Plan

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Security, QA, Principal Engineering, Backend, Database Architecture, Product, DevOps

## Related ADRs

- ADR-0009: Migration, Backup, and Recovery Strategy
- ADR-0015: Append-Only Ledger and Audit Controls
- ADR-0019: Receiving Workflow Boundary
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal
- ADR-0029: Receiving Draft API Contract Proposal
- ADR-0030: Receiving Draft Implementation Slice And Rollout Plan
- ADR-0031: Inbound Permission Allowlist And Error-Code Alignment

## Problem

Every Gate 7B ADR lists security review and production-impact review as
remaining blockers, but no scoped plan exists for the draft slice. Without one,
review becomes ad hoc: each reviewer invents their own threat list, evidence
standard, and sign-off bar, or defers review until production enablement when
remediation is expensive.

The draft slice needs a review plan proportional to its risk: pre-posting
mutations with no ledger effect, but with real tenant, warehouse-scope,
permission, concurrency, idempotency, and audit surfaces. The plan must map the
existing threat register to slice-specific controls, define evidence per
control, and state the production-impact bar for a flag-off-by-default slice.

This ADR proposes that plan. It authorizes no code, migration, test, or
production change.

## Context

What the slice is and is not:

- Eight internal routes behind `ENABLE_INTERNAL_RECEIVING_DRAFTS=false`, with
  target authorization, composite-FK persistence, idempotent transactions, and
  transactional audit.
- No receipt, stock, ledger, putaway, or PO-quantity writes by construction.
- No shared-middleware change, no legacy-route change, no seed change.
- Production posture stays NO-GO; the flag must never be enabled in Render or
  Vercel production under this gate.

Existing review infrastructure this plan reuses:

- Threat register T-01 through T-15 in `docs/Security.md` section 4.
- Release blockers and checklist in `docs/Security.md` section 5 and
  `docs/ProductionReadiness.md`.
- CI gates in `docs/Testing.md` section 3: formatting, lint, typecheck, unit,
  integration, E2E, migration validation, secret scanning, dependency audit,
  SAST, container scan, staging DAST, accessibility smoke, build validation.
- Operations targets in `docs/Operations.md`: structured request-ID logs with
  redaction, pilot p95 targets, backup and restore drills, incident runbooks.

## Alternatives

### Alternative 1: No slice review plan; rely on full-launch review later

Pros:

- Less planning overhead now.

Cons:

- Threats specific to drafts (warehouse-scope bypass, SoD bypass, idempotency
  replay, partial-index races) go unexamined until production enablement.
- Findings arrive when remediation requires data migration or contract breaks.

Decision:

- Rejected.

### Alternative 2: Full production-launch review now for the draft slice

Pros:

- Maximum assurance early.

Cons:

- Requires OIDC rotation, sender-domain verification, OAuth, RPO/RTO drills,
  and tablet UX audits that belong to the launch gate, not a flag-off slice.
- Blocks slice implementation on unrelated launch blockers.

Decision:

- Rejected. Launch review stays at the release gate.

### Alternative 3: Scoped slice review plan with explicit evidence and sign-off bar

Pros:

- Each threat maps to a slice control with testable evidence.
- Production impact is assessed for a disabled-by-default slice, not a launch.
- Findings are cheap to fix before migration and routes exist.

Cons:

- Requires reviewer time before implementation approval.
- Some checks (staging DAST, restore drill with new tables) execute during
  implementation, not at plan approval.

Decision:

- Selected proposal direction.

## Decision

### Threat-To-Control Mapping

| Threat | Slice control | Evidence |
| --- | --- | --- |
| T-01 cross-tenant access | Membership-only tenant authority; composite FKs; tenant-scoped loads after authorization; cross-tenant `404` without leakage | Disposable integration: cross-tenant PO, draft, line, and warehouse IDs reveal neither existence nor data |
| T-02 horizontal warehouse access | Exact active assignment per persisted draft warehouse; `OWNER`/`ADMIN` do not bypass; inactive warehouse `404` | Assigned read and mutation allow; unassigned `403`; inactive `404`; deactivated-warehouse mutation denial |
| T-03 role escalation and SoD bypass | Finite allowlist delta (ADR-0031); disjoint reviewer and operator bundles; creator self-approval denial; custom-role effective-bundle rule | Domain matrix tests; creator self-approval denial including via custom role; wildcard and unknown-grant denial |
| T-06 duplicate retry corruption | Unique idempotency claim; same-hash replay; different-hash `409`; bounded in-flight wait; single-transaction commit | Replay, mismatch-conflict, concurrent-duplicate, and audit-rollback tests |
| T-07 concurrency race | Row locks plus serializable transactions; conditional version bump; partial active-draft index; bounded retry with `409 CONCURRENCY_RETRY_EXHAUSTED` exhaustion | Stale-version, stale-quantity, concurrent-create, and deadlock-retry tests |
| T-08 ORM and PII leakage | Allowlisted DTOs; string decimals; ISO-8601 dates; exclusion of prices, secrets, sessions, auth context, audit, and idempotency material | Contract DTO assertions per route plus secret-scan of fixtures and logs |
| T-10 injection and bounded input | Strict Zod schemas; string-only decimals; bounded arrays (max 200), reasons (500), references (200); parameterized Prisma queries; no raw string interpolation | Unknown-field, oversize, and type-confusion contract tests; SAST |
| T-13 secret exposure | No credential, token, cookie, or header in audit, logs, DTOs, or error details; secret scanning in CI | Secret scan, audit-payload assertions, log-redaction review |
| T-14 audit tampering | Transactional `AuditLog` write per mutation; append-only trigger; best-effort authz log never substitutes for mutation audit | Induced audit-failure rollback test; trigger-bypass role review |
| T-04/T-05 session and token abuse | Shared bearer handling unchanged; target session revocation and expiry via mapper; inactive identity and membership deny | Revoked, expired, inactive-identity, and inactive-membership tests |
| T-09 CSRF | SameSite and origin controls unchanged by the slice; mutations require bearer auth, not cookie-only ambient authority | Existing auth test suite plus slice route auth-matrix tests |
| T-15 dependencies | Lockfile audit with time-bound exceptions only; container scan for deployable image | `pnpm audit`, Trivy, CI gates |

Out of scope for slice review (tracked at launch gate, not here):

- T-11 CSV injection (no draft export in this slice).
- T-12 SSRF (no new outbound fetch in this slice).
- OAuth, MFA, and session-device UI.
- Tablet UX and WCAG audit for draft screens (no UI in this slice).

OWASP Top 10 (2021) mapping for reviewers:

- A01 access control: T-01, T-02, T-03 rows above.
- A02 cryptographic failures: no new cryptography; SHA-256 request hashes are
  integrity keys, not secrets; no password or token material in scope.
- A03 injection: T-10 row above.
- A04 insecure design: state machine, SoD, and idempotency design reviewed in
  ADR-0024 through ADR-0029 before code.
- A05 misconfiguration: flag default off, dual-site production guard, no prod
  enablement.
- A07 authentication failures: T-04 and T-05 rows above.
- A08 integrity failures: idempotency result plus audit committed atomically;
  no unsigned client state.
- A09 logging failures: request-ID structured logs with redaction; deny-aware
  diagnostics without secrets.
- A10 SSRF: not applicable to this slice.

### Security Review Checklist

Reviewers must record evidence or an explicit finding for each item.
A finding blocks implementation approval until remediated or risk-accepted by
an accountable owner with expiry:

1. Tenant isolation proofs for every read and mutation path.
2. Warehouse-scope proofs including inactive and unassigned cases.
3. Finite-grant proofs including wildcard, unknown, prefix, and malformed
   grants plus legacy-backfill assignment denial.
4. Separation-of-duties proofs at grant level and per-draft creator level.
5. Idempotency replay, mismatch, in-flight, and rollback proofs.
6. Concurrency proofs for versions, open quantities, and duplicate active
   drafts.
7. DTO allowlist proofs including decimal, date, variant-null, and exclusion
   assertions.
8. Input-bound proofs including strict rejection and array and length limits.
9. Audit transactionality proofs including induced-failure rollback.
10. Secret exclusion proofs across DTOs, errors, audit rows, and logs.
11. Dependency, SAST, and secret-scan results with owners for any exception.
12. Confirmation that no ledger, stock, receipt, or PO-quantity write exists on
    any draft path (negative testing with row-count assertions).

### Production-Impact Review Plan

Scope: a disabled-by-default internal slice, not a launch. The bar is no
adverse production impact while disabled, plus a safe path for disposable and
staging verification.

Checklist:

1. Flag default `false` in code, config, and documentation; no environment
   file enables it in production.
2. Dual-site production guard (`config/index.ts` and `app.ts`) verified by
   route-registration tests and startup tests.
3. Migration impact: additive tables, indexes, and parent uniques only; empty
   and existing-data disposable verification; no backfill; no change to
   existing service behavior when the flag is off.
4. Performance: pilot targets apply on disposable and staging measurement
   (reads p95 under 300 ms, commands p95 under 500 ms excluding external
   delivery). Lock scope is one PO plus one draft plus its lines; bounded
   waits (`lock_timeout = 3s` proposed) and retries (3 attempts proposed)
   prevent unbounded contention. Flag-off paths add no query cost beyond flag
   check and `404`.
5. Observability: request-ID errors, structured auth-failure logs, deny-aware
   diagnostics, and metrics for conflicts, replays, mismatches, retries, and
   failures. No secret or payload logging.
6. Backup and restore: new tables are covered by provider backups and logical
   exports; a restore drill into an isolated database runs migrations and
   representative tenant and authorization queries before any staging promotion
   involving real data.
7. Rollback drill: flag-off procedure from ADR-0030 is executed in a disposable
   environment with row-preservation verification.
8. Runbooks referenced: failed migration, application rollback, authentication
   incident, and cross-tenant authorization incident. No new runbook is
   required for this slice beyond referencing the existing incident procedures.

### Sign-Off Bar

Implementation approval requires all of:

- Security checklist items 1–12 evidenced or risk-accepted with owner and
  expiry.
- Production-impact items 1–8 evidenced for the flag-off posture plus
  disposable and staging measurement where applicable.
- Production remains NO-GO and the flag stays disabled in Render and Vercel
  production with no exception under this gate.

## Consequences

- Slice reviewers share one threat map, one checklist, and one sign-off bar
  instead of inventing criteria per review.
- Findings arrive before migration and route code exist, when fixes are cheap.
- Launch-gate items stay at the launch gate instead of blocking slice work.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve or execute:

- Any code, test, migration, or configuration change.
- Any security scan execution or result.
- Any performance measurement.
- Any backup, restore, or rollback drill execution.
- Any risk acceptance or exception.
- Ledger posting, canonical promotion, or production enablement.
