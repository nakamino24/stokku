# Testing Strategy

**Status:** Phase 0 proposed baseline

## 1. Test Pyramid

### Domain unit tests

Pure tests cover quantity arithmetic, UOM conversion, status transitions,
allocation policy, permission evaluation, idempotency decisions, error mapping,
and reconciliation calculations. These tests do not use HTTP or a database.

### Integration tests

Disposable PostgreSQL through Testcontainers covers migrations, foreign keys, row
level policies, tenant isolation, repository predicates, ledger posting, receipt
and allocation concurrency, shipment/receipt retry, rollback, unique constraints,
and audit persistence.

### Contract tests

OpenAPI contracts cover request validation, response DTO allowlists, error shape,
pagination, idempotency headers, and authorization status codes.

### End-to-end tests

Playwright covers login/session restoration, verification and reset, protected route
behavior, purchase order and receiving, putaway, sales allocation, pick/pack/ship,
cycle count, denied permissions, mobile/tablet viewports, slow network, and retry.

## 2. High-Risk Test Cases

- User from organization A cannot read or mutate organization B records.
- User scoped to warehouse A cannot complete a task in warehouse B.
- Administrator cannot promote a user to owner or remove the owner through a normal
  role command.
- Two concurrent allocations cannot reserve the same last unit.
- Two concurrent receipt posts cannot increase physical stock twice.
- Retrying a receipt or shipment with the same key returns the original result.
- Reusing a key for a different body is rejected.
- Failed transactions leave no balance, ledger, audit, or outbox partial write.
- A raw user, session, reset token, or password hash never appears in a response.
- Reversal creates a compensating entry and cannot be posted twice.

## 3. CI Gates

Required checks are formatting, lint, typecheck, unit, integration, E2E, migration
validation, secret scanning, dependency audit, SAST, container scanning, DAST on
staging, accessibility smoke tests, and build validation. Critical authorization and
inventory packages have risk-based coverage thresholds higher than ordinary UI code.

Tests use isolated databases and deterministic fixtures. Production credentials and
production databases are forbidden in test processes.

## 4. Conditional Integration Suites

Some integration suites are intentionally conditional and must not be reported as
passed when they are skipped.

| Suite | Run condition | Skip or guard status | Evidence classification |
| --- | --- | --- | --- |
| `apps/api/src/__tests__/health.integration.test.ts` | `DATABASE_URL` is set and `RUN_DATABASE_INTEGRATION_TESTS=true` | Skipped when database credentials or explicit opt-in are unavailable | Pre-existing environment limitation; not Gate 6 evidence |
| `apps/api/src/target-authorization/authorization-parity.integration.test.ts` | `RUN_DATABASE_INTEGRATION_TESTS=true`, `DATABASE_URL` is local (`localhost` or `127.0.0.1`), and `NODE_ENV` is not production | Skipped when local disposable DB is unavailable; fail-fast if explicit run targets production, Neon, AWS RDS, or production node environment | Safety guard for non-local DB; not Gate 6 evidence |

For ADR-0022 schema/migration verification, the same skipped-suite rules apply:

- `apps/api/src/__tests__/health.integration.test.ts` is environment-dependent and requires `RUN_DATABASE_INTEGRATION_TESTS=true`; it is not migration verification evidence.
- `apps/api/src/target-authorization/authorization-parity.integration.test.ts` is environment-dependent and requires a local disposable database URL plus the integration flag; it is not migration verification evidence.
- Correct ADR-0022 full-suite reporting is 41 suites passed, 2 suites skipped due to environment guards, 204 tests passed, and 10 tests skipped.
- Dedicated disposable migration checks are the primary ADR-0022 schema/migration evidence.

ADR-0023 Gate 7A tests separately prove read-only receiving queue behavior. ADR-0022 migration evidence is not a substitute for queue authorization, DTO, audit, or tenant-isolation tests.

ADR-0026 identifies planned-warehouse authoring as a Gate 7B prerequisite. Its
future verification must separately cover strict command validation, purchasing
authority, active same-tenant warehouse checks, commercial approval invalidation,
compare-and-set conflicts, idempotency replay and mismatch conflicts, transactional
audit, and concurrent lifecycle races. Gate 7A read-only evidence does not verify
these purchase-order mutations.

ADR-0027 identifies target inbound authorization as a separate Gate 7B prerequisite.
Its future disposable PostgreSQL coverage must prove independent membership
deactivation, finite-grant enforcement, exact active warehouse assignment, no
owner/admin scope bypass, legacy wildcard and backfill-assignment denial,
creator/reviewer separation, tenant non-disclosure, and transactional audit for
authority changes. Parity-probe and Gate 7A read-only tests are not evidence for
these mutation controls.

ADR-0028 proposes exact draft persistence without authorizing implementation. Its
future verification must separately prove empty and existing-data migration,
cross-tenant and null-destination rejection, draft-warehouse equality,
line-parentage integrity, single active draft per PO, quantity and reason CHECKs,
idempotency replay and mismatch conflict, bounded in-flight behavior, optimistic
concurrency, transactional audit, and zero ledger or stock writes.

ADR-0029 proposes the exact internal draft API contract without authorizing
implementation. Its future verification must separately prove strict unknown-field
rejection, string-only decimals, idempotency-header enforcement, line-membership
integrity, reason and version requirements, allowlisted DTO shape, explicit error
codes including internal `OVER_RECEIPT`, flag-off behavior, and production
fail-closed startup. Contract tests alone are never implementation evidence.

ADR-0030 proposes the bounded draft slice and rollout plan without authorizing
implementation. Its future verification must separately prove entry-criteria
satisfaction, file-scope compliance, pipeline ordering, transaction template
behavior, focused plus full-suite gates with guarded skips, flag rollback, and
zero ledger or stock writes.

ADR-0031 proposes the exact allowlist and error-code ownership without
authorizing implementation. Its future verification must separately prove the
extended allowlist, the disjoint reviewer and operator bundles, `OWNER` without
approve/reject, custom-role separation, `UNAUTHORIZED` versus `UNAUTHENTICATED`
ownership, and internal-only `OVER_RECEIPT` mapping.

ADR-0032 proposes the scoped slice review plan without authorizing or executing
it. Its future verification must separately record the twelve-item security
checklist, the eight-item production-impact checklist, and the sign-off bar
with production remaining NO-GO.

ADR-0033 defines the future posting and ledger boundary as planning without
authorizing implementation. Its future verification must separately prove
approved-only posting, warehouse equality, exactly-once replay, concurrent-post
safety, atomic eight-write commit with rollback, accepted-only projection math,
PO derivation, reversal-only correction, and creator-may-not-post.

ADR-0034 defines the two-phase approval gate without granting any approval. Its
record is per-ADR sign-off, evidence bundle, status transition, and expiry, not
test execution.

ADR-0035 plans phased canonical promotion without authorizing it. Its future
verification must separately prove dual-serve parity, keyset cursor opacity and
scope binding, deprecation headers, OpenAPI snapshots, migration telemetry, and
internal-removal `404`.

ADR-0023 verification evidence:

- Focused Gate 7A suite passed: 3 suites, 16 tests.
- Full API Jest suite passed: 44 suites passed, 2 suites skipped due to environment guards, 220 tests passed, and 10 tests skipped.
- Disposable PostgreSQL suite verified tenant/warehouse predicates and no stock, receipt, ledger, or purchase-order mutation.
- `apps/api/src/__tests__/health.integration.test.ts` remains environment-dependent and is not Gate 7A evidence unless explicitly enabled with safe local database configuration.
- `apps/api/src/target-authorization/authorization-parity.integration.test.ts` remains environment-dependent and is not Gate 7A evidence unless explicitly enabled with safe local database configuration.

Future ADR-0024 Gate 7B tests must separately prove receiving draft state transitions, idempotency behavior, concurrency handling, audit, and no inventory effects before posting. Gate 7A read-only tests are not evidence for receiving mutation correctness.

Required reporting terms:

- `Passed`: test executed and assertions passed.
- `Skipped because local disposable DB unavailable`: test did not execute because local DB configuration was absent.
- `Skipped because safety guard rejected non-local DB`: test did not execute because the requested database target was unsafe.
- `Pre-existing environment limitation`: skip existed outside the current gate and is not a product acceptance signal.
- `Not Gate 6 evidence`: skipped suites are excluded from Gate 6 pass/fail evidence.
