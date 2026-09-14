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
