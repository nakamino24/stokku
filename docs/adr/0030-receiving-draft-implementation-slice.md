# ADR-0030: Receiving Draft Implementation Slice And Rollout Plan

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Principal Engineering, Backend, QA, Security, Database Architecture, Product

## Related ADRs

- ADR-0007: API Versioning and Command Contract
- ADR-0009: Migration, Backup, and Recovery Strategy
- ADR-0016: Target Architecture Transition
- ADR-0017: Authorization Adapter Parity Probe
- ADR-0019: Receiving Workflow Boundary
- ADR-0023: Warehouse-Scoped Receiving Queue
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal
- ADR-0029: Receiving Draft API Contract Proposal

## Problem

ADR-0026 through ADR-0029 lock the what for Gate 7B pre-posting drafts:
authoring rules, authorization policy, exact persistence shape, and exact HTTP
contract. No ADR yet locks the how: which files may change, in what order,
behind which flag, with which production guard, with what test gates, and with
what rollback and evidence obligations.

Without that slice plan, implementation could sprawl into legacy purchase-order
flows, shared auth middleware, receipt posting, stock projection, or production
configuration, or arrive as one unreviewable commit mixing schema, routes,
permissions, and seeds.

This ADR proposes the implementation slice and rollout plan. It authorizes no
code, migration, route, permission, seed, flag, or production change.

## Context

Established slice precedent:

- Gate 7A (ADR-0023) shipped as new files only
  (`receiving-queue.schema.ts`, `receiving-queue.service.ts`,
  `receiving-queue.routes.ts`, three test files), plus flag registration in
  `apps/api/src/config/index.ts`, conditional mounting in `apps/api/src/app.ts`,
  production fail-closed validation in both places, and documentation.
- Disabled by default (`ENABLE_INTERNAL_RECEIVING_QUEUE=false`); when off, the
  path falls through to the existing `404 NOT_FOUND` catch-all.
- Production startup throws when the flag is true.
- Existing purchase-order routes, `PurchaseOrderService.receive()`, receipt,
  stock, ledger, and production config were untouched.

Current draft prerequisites remain proposed, not implemented:

- ADR-0026 authoring contract (including its own migration, permission, and
  route work) is not implemented.
- ADR-0027 authorization-policy storage and migration is not implemented.
- ADR-0028 persistence tables, constraints, and indexes are not created.
- ADR-0029 routes, schemas, and DTOs do not exist.
- The finite target permission allowlist has no inbound draft permissions at
  runtime.
- Shared `authMiddleware` still emits `UNAUTHORIZED`, while the draft contract
  proposes `UNAUTHENTICATED` for its own 401s via the target deny mapper.

Entry criteria for the draft slice defined here:

1. ADR-0026 authoring implementation is approved, implemented, and verified, so
   ordinary purchase orders can carry a persisted destination.
2. ADR-0027 authorization-policy storage and migration is approved, implemented,
   and verified, so membership lifecycle, finite grants, and explicit warehouse
   scope are durable.
3. ADR-0028 persistence migration is approved, implemented, and verified on
   disposable empty and existing-data databases.
4. This slice plan (ADR-0030) and the ADR-0029 contract are approved.
5. Security review and production-impact review for the slice are recorded.

If any entry criterion is unmet, draft-slice coding must not start.

## Alternatives

### Alternative 1: Single big-bang commit with schema, authz storage, authoring, drafts, and seeds

Pros:

- One review, one merge.

Cons:

- Mixes four approval domains with different risk profiles.
- Unreviewable diff; rollback is all-or-nothing.
- A failure in one domain blocks or reverts the others.
- Violates the ADR-0016 vertical-slice transition rule.

Decision:

- Rejected.

### Alternative 2: Implement draft routes first against application-level checks, add database guarantees later

Pros:

- Faster first route.

Cons:

- Ships the exact weak-FK failure ADR-0020 rejected: tenant, warehouse-equality,
  and line-parentage rules live only in service code.
- Concurrent creates can double-activate drafts for one PO before the partial
  index exists.
- Quantity and reason invariants depend on every writer behaving correctly.

Decision:

- Rejected.

### Alternative 3: Phased prerequisites first, then a bounded draft vertical slice behind its own flag

Pros:

- Each phase has its own approval, migration verification, tests, and rollback.
- The draft slice lands on proven persistence and authorization storage.
- The draft flag independently disables all eight draft routes with no data
  cleanup.
- Ledger posting stays a separate future gate by construction.

Cons:

- Slower calendar time; more ADRs and review rounds.
- Temporary coexistence of legacy and target authorization paths.

Decision:

- Selected proposal direction.

## Decision

Propose a bounded draft vertical slice executed only after its entry criteria
are met, behind its own disabled-by-default flag, with an explicit file scope,
transaction template, test gates, rollback procedure, and evidence template.
Proposal only.

### Feature Flag

Name proposed (not registered by this ADR):

- `ENABLE_INTERNAL_RECEIVING_DRAFTS=false` by default.

Rules:

- Registered once in `apps/api/src/config/index.ts` under `config.features`.
- Read only on the server; never exposed via `NEXT_PUBLIC_*` or the web bundle.
- All eight draft routes mount only when true; when false they fall through to
  the existing `404 NOT_FOUND` catch-all in `apps/api/src/app.ts`.
- Production startup must fail closed in both validation sites:
  `config/index.ts validateConfig()` and `app.ts validateConfig()`.
- Independent from `ENABLE_INTERNAL_RECEIVING_QUEUE`,
  `ENABLE_INTERNAL_INVENTORY`, and `ENABLE_TARGET_AUTHORIZATION_ADAPTER`.
- Must not be enabled in Render or Vercel production.
- Log a single startup line per state, matching the Gate 7A precedent.

### Allowed Implementation Scope After Approval

After separate implementation approval, the slice may change only:

- `apps/api/src/modules/inbound/receiving-draft.schema.ts` (strict per-command
  Zod schemas from ADR-0029).
- `apps/api/src/modules/inbound/receiving-draft.service.ts` (serializable
  transactions, version checks, open-quantity revalidation, idempotency claim
  and replay, transactional audit, allowlisted DTO mapping).
- `apps/api/src/modules/inbound/receiving-draft.routes.ts` (pipeline order
  from ADR-0029, target `authorize()` per command, no legacy RBAC gate).
- `apps/api/src/modules/inbound/__tests__/receiving-draft.routes.test.ts`
  (contract tests).
- `apps/api/src/modules/inbound/__tests__/receiving-draft.route-registration.test.ts`
  (flag-off `404`, flag-on mounting, production fail-closed).
- `apps/api/src/modules/inbound/__tests__/receiving-draft.integration.test.ts`
  (disposable PostgreSQL: tenant isolation, scope, lifecycle, idempotency,
  concurrency, audit transactionality, zero ledger effect).
- `apps/api/src/config/index.ts` (flag registration plus production guard).
- `apps/api/src/app.ts` (conditional mounting plus production guard).
- Documentation for the slice (gate note, API internal section, testing and
  readiness updates, traceability row status).

### Explicit Non-Scope

The slice must not change:

- `PurchaseOrderService` including `receive()`.
- Existing purchase-order routes and schemas.
- `GoodsReceipt` / `GoodsReceiptLine` behavior or status enum.
- `StockMovement` / `StockLevel` behavior, ledger code, or reconciliation code.
- Putaway, allocation, pick, pack, shipment, return, or dashboard code.
- Shared `authMiddleware`, shared `validate`, shared `requireIdempotencyKey`,
  or the `UNAUTHORIZED` code it emits; the slice uses route-local strict
  parsing and the target deny mapper for its own `UNAUTHENTICATED` 401s without
  altering shared middleware.
- Legacy `rbac.ts` / `warehouseScope.ts` semantics.
- Seed data for production or demo tenants.
- Render, Vercel, Docker, or environment configuration beyond reading the new
  flag.
- Ledger posting, canonical API promotion, or OpenAPI generation.

Any change outside this list requires its own ADR and review.

### Transaction Template

Every mutation command in the slice must follow this template:

1. Resolve membership context and authorize before any business read.
2. Load the tenant-scoped draft (and PO plus lines where the command needs
   them) with row locks (`SELECT ... FOR UPDATE`) inside a serializable
   transaction.
3. Revalidate PO status (`SENT` / `PARTIALLY_RECEIVED`), warehouse active
   state, warehouse equality, per-line open quantities, and command-specific
   state preconditions against the locked rows.
4. Insert or lock the `IdempotencyCommand` claim
   `(organizationId, commandName, idempotencyKey)` with a bounded wait
   (`lock_timeout = 3s` proposed).
5. On same-key same-hash replay, return the stored result with no transition.
6. On same-key different-hash, return `409 IDEMPOTENCY_KEY_REUSED` with no
   transition.
7. On valid first execution, apply the conditional version bump
   (`WHERE id = ? AND version = ?`), mutate lines, write the `AuditLog` row,
   and mark the command `SUCCEEDED` with the allowlisted result, all in the
   same transaction.
8. On expected business failure, store sanitized `FAILED_FINAL` with a safe
   error code and return the mapped HTTP error with no domain transition.
9. On unexpected infrastructure failure, roll back the entire transaction
   including the claim, so the same key can be safely retried.
10. Map serialization, deadlock, and partial-index conflicts to bounded retry
    (up to 3 attempts proposed); exhaustion returns
    `409 CONCURRENCY_RETRY_EXHAUSTED`.

No step in this template may write receipts, receipt lines, movements, levels,
PO received quantities, PO statuses, putaway tasks, or document sequences.

### Test Gates

Focused suite (new files only):

- Flag false returns `404 NOT_FOUND` for all eight paths.
- Flag true without authentication returns `401`.
- Strict unknown-field, number-quantity, idempotency-header, version, and
  reason validation per ADR-0029.
- Line add/remove/rebind rejected; all-zero submit rejected.
- Scope matrix: cross-tenant, missing, and inactive warehouse `404`;
  unassigned warehouse and missing permission `403`; self-approval `403`.
- Transition matrix including every forbidden transition.
- Replay, mismatch-conflict, over-receipt, stale-version, and stale-quantity
  behavior.
- DTO allowlist, string decimals, ISO-8601 dates, secret exclusion.
- Production startup rejects the flag.

Full suite:

- Entire API Jest suite passes with only environment-guarded skips
  (`health.integration.test.ts` and
  `authorization-parity.integration.test.ts` unless disposable local database
  configuration is present).
- Prisma validate, API typecheck, API build, database lint, API lint
  (pre-existing warnings only), `docs:check`, and `git diff --check` pass.
- Skipped suites are reported as skipped with their guard reason, never as
  passed.

Disposable PostgreSQL integration suite must additionally prove the behaviors
listed in ADR-0026 through ADR-0029, including entry-criteria dependencies,
transactional audit commit and rollback, and zero writes to ledger and stock
surfaces.

### Rollback Procedure

Activation:

1. Set `ENABLE_INTERNAL_RECEIVING_DRAFTS=true` in a local or disposable
   environment only.
2. Restart the API.
3. Draft routes become available.

Rollback:

1. Set `ENABLE_INTERNAL_RECEIVING_DRAFTS=false`.
2. Restart the API.
3. Confirm all eight paths return `404 NOT_FOUND`.
4. Preserve draft, line, and idempotency rows for audit and operator recovery;
   do not delete or mutate them as rollback.
5. Do not touch posted receipts, movements, levels, or audit rows.

Rollback guarantees:

- No applied migration is edited or reversed.
- No production data cleanup is required because production never enables the
  flag.
- Reference purchase-order, receipt, stock, and Gate 7A queue behavior is
  unaffected.

### Verification Evidence Template

To be filled only after separate implementation approval:

- Focused draft suite result (suites passed, tests passed).
- Full API suite result (suites passed/skipped, tests passed/skipped with guard
  classification).
- Disposable migration evidence reference (belongs to the prerequisite phase,
  re-confirmed here with no new migration).
- Tenant, scope, lifecycle, separation-of-duties, idempotency, concurrency,
  audit, and zero-ledger-effect evidence summary.
- Flag rollback and production fail-closed evidence.
- Quality-gate list with exact commands and outcomes.

No evidence fields are pre-filled by this proposal.

## Implementation Blockers Remaining

Even after this slice plan is approved, coding remains blocked until:

- Entry criteria 1–5 above are implemented and verified.
- Runtime permission allowlist update is approved.
- Exact 401-code coexistence (`UNAUTHORIZED` shared vs `UNAUTHENTICATED`
  slice) is accepted in review.
- Contract and integration test files are executed against disposable
  PostgreSQL with recorded evidence.
- Security review and production-impact review are recorded.

## Consequences

- Gate 7B gains a reviewable execution plan with a bounded file scope,
  independent flag, explicit non-scope, transaction template, test gates, and
  rollback procedure.
- Prerequisites stay ordered: authoring, authorization storage, and persistence
  land before draft routes.
- Ledger posting, canonical promotion, and production enablement remain
  separate future gates.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- Any file change, including the files listed in the allowed scope.
- Flag registration or production guard code.
- Migration execution.
- Permission allowlist changes.
- Shared middleware changes.
- Seed or fixture changes.
- Production configuration changes.
- Any change to `PurchaseOrderService.receive()`.
- Any change to Gate 7A read-only behavior.
- Ledger posting or canonical promotion.
- Production enablement.
