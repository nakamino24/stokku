# Repository Structure Transition

**Status:** Phase 0 approved direction
**Decision:** Add target boundaries through vertical slices; do not bulk-move the
reference runtime.

## Target Layout

```text
apps/
  web/
    app/                    # Introduced per approved web slice
    features/
      auth/
      catalog/
      warehouses/
      inventory/
      inbound/
      outbound/
      execution/
      reporting/
    components/
    lib/
    styles/
    tests/e2e/
  api/
    src/
      bootstrap/
      config/
      http/middleware/
      http/routes/v1/
      modules/
      shared/
  worker/
    src/
      bootstrap/
      jobs/email/
      jobs/exports/
      jobs/webhooks/
packages/
  domain/
  contracts/
  validation/
  database/
  ui/
  config/
  test-fixtures/
docs/
  adr/
  reference/
docker/
scripts/
.github/workflows/
```

## Current-State Mapping

| Current path | Classification | Transition rule |
| --- | --- | --- |
| `apps/web/pages/` | Reference Pages Router UI | Do not move until the owning feature gains an approved App Router slice |
| `apps/api/src/app.ts`, `server.ts` | Reference bootstrap | Keep stable until the new API bootstrap owns a complete route slice |
| `apps/api/src/modules/` | Reference feature services | Do not relabel as domain; extract rules behind ports only per feature |
| `packages/database/prisma/` | Active reference persistence | Never move or rename migrations; retain until a data-transition plan exists |
| `packages/ui/` | Reusable candidate | May be consumed by new web features after dependency review |
| `docs/reference/` | Historical/runtime evidence | Never defines new requirements |

## Dependency Rules

- `packages/domain` has no dependency on HTTP, React, Prisma, Drizzle, or environment variables.
- `packages/contracts` contains serializable DTOs, schemas, stable error codes, and types only.
- `packages/validation` validates input without database access.
- `packages/database` implements persistence adapters; UI never imports it.
- HTTP routes translate transport into commands; they do not contain inventory rules or authorization policy.
- Modules communicate through explicit application services, ports, or domain events, not cross-feature repository imports.
- Every business data access path receives organization scope; warehouse-scoped paths receive warehouse scope.

## Migration Order and Rollback

1. Identity, sessions, organization membership, and warehouse authorization.
2. Catalog.
3. Warehouse topology.
4. Inventory ledger, projections, and reconciliation.
5. Inbound receiving and putaway.
6. Outbound allocation, picking, packing, and shipment.
7. Mobile/barcode execution.
8. Reporting, audit, and worker jobs.

Each slice retains the reference path until unit, integration, authorization,
tenant-isolation, contract, and relevant E2E tests pass. Rollback routes traffic to
the prior path and uses additive, forward-compatible database changes only. No
framework, router, ORM, or migration-directory rename is permitted as housekeeping.
