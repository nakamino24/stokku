# ADR-0015: Append-Only Ledger and Audit Controls

**Status:** Accepted; implemented

## Problem

Inventory movements and audit records are evidence of business activity. Application
authorization alone is not sufficient protection against accidental or compromised
application code mutating historical records.

## Context

The inventory ledger already uses reversal records rather than edits. Audit records
are written from multiple domain services and are read by reporting workflows. The
database runs on PostgreSQL and migrations are the controlled schema-change boundary.

## Alternatives

- Rely only on service-layer conventions.
- Restrict mutation through application permissions.
- Enforce update/delete rejection with PostgreSQL triggers and use a restricted
  runtime database role in production.

## Pros

- Protection applies regardless of which application path issues a mutation.
- Reversal semantics remain explicit and auditable.
- The control is testable during migration and integration verification.

## Cons

- Administrative retention or legal deletion requires a separate reviewed process.
- Database owners and migration roles can still bypass triggers; operational role
  separation remains required.
- Existing rows are not retroactively cryptographically signed.

## Decision

Install PostgreSQL triggers that reject `UPDATE` and `DELETE` on `StockMovement` and
`AuditLog`. Inventory corrections must create reversal movements. Production runtime
credentials must not own these tables or have trigger-bypass capability; migrations
run under a separate deployment role.

## Consequences

The application receives a database error for direct historical mutation attempts.
The production deployment checklist must verify role grants and retain a controlled
break-glass procedure for migrations and compliance operations.
