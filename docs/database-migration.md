# PostgreSQL WMS Migration Runbook

The new migration chain targets PostgreSQL 15 or newer. The old SQLite-era SQL
is retained under `prisma/migrations-sqlite-archive` for history only and is not
part of `prisma migrate deploy`.

## Fresh database

Set `DATABASE_URL` to an empty PostgreSQL 15+ database, then run:

```bash
pnpm install --frozen-lockfile
pnpm --filter @stokku/database exec prisma validate
pnpm --filter @stokku/database exec prisma migrate deploy
pnpm --filter @stokku/database exec prisma db seed
pnpm --filter @stokku/api test -- --runInBand inventory.integration.test.ts
pnpm build
```

The baseline creates the complete schema, constraints, indexes, and immutable
ledger trigger. The guarded bridge migration is a no-op on the empty baseline.

## Existing PostgreSQL database previously managed by `db push`

Use a maintenance window. Do not run application writers during the upgrade.

1. Take and verify a restorable database backup.
2. Confirm the database has the legacy `StockLevel.quantity` column and does
   not already contain a partially applied WMS migration.
3. Run a staging restore and complete the full procedure there first.
4. Mark only the new baseline as applied; do not execute it against existing
   tables:

```bash
pnpm --filter @stokku/database exec prisma migrate resolve \
  --applied 20260907000000_postgresql_baseline
pnpm --filter @stokku/database exec prisma migrate deploy
```

The bridge migration:

- blocks before alteration if legacy physical stock is negative or open-order
  demand cannot be reconstructed from available physical stock;
- converts quantities and monetary fields to exact decimal types;
- normalizes fake empty foreign keys to `NULL` and merges duplicate balance
  identities;
- preserves legacy movements and appends compensating opening movements so the
  ledger matches current physical balances;
- discards ambiguous DRAFT/zombie reservations and reconstructs exact
  allocations for CONFIRMED/PICKING/PACKED orders;
- creates first-class receipts, document sequences, system permissions, balance
  checks, and ledger immutability.

If a preflight fails, remediate the reported data on the staging copy and retry
from a clean restore. If any later statement fails, restore the backup before
retrying; PostgreSQL enum changes and Prisma migration files are not assumed to
be one transaction.

## Post-deploy validation

```bash
pnpm --filter @stokku/database exec prisma migrate status
pnpm --filter @stokku/api test -- --runInBand inventory.integration.test.ts
```

As an OWNER/ADMIN or a role with `inventory.reconcile`, call:

```http
GET /api/v1/stock/reconciliation
```

Deployment is complete only when it returns `reconciled: true`. Keep the backup
until application smoke tests, receipt posting, allocation, cancellation, and
shipment checks have passed.
