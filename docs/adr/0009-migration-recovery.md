# ADR-0009: Migration, Backup, and Recovery Strategy

**Status:** Accepted for review

## Problem

Inventory data cannot be safely managed with ad hoc schema changes or untested
restores.

## Context

The reference database is not the target rebuild schema. Production changes must be
traceable and reversible at the application level.

## Alternatives

- In-place manual SQL and destructive rollback.
- Provider-only backups with no restore drill.
- Reviewed forward migrations, expand/contract deployment, and verified restores.

## Decision

Use versioned Drizzle migrations, disposable database validation, commit-SHA
deployments, provider backups plus logical exports, and scheduled restore drills.
Rollback deploys a compatible previous version or uses compensating data repair.

## Consequences

Releases require more planning, but schema and recovery behavior are auditable.
