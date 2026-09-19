# ADR-0022: Planned Warehouse Schema Implementation and Migration

**Status:** Implemented and verified; Gate 7A follow-on approved and verified by ADR-0023  
**Date:** 2026-09-18  
**Owners:** Database Architecture, Backend, Security, Product, QA  
**Related:** ADR-0003 Tenant and Warehouse Authorization, ADR-0009 Migration, Backup, and Recovery Strategy, ADR-0020 Purchase Order Receiving Warehouse Ownership, ADR-0021 Purchase Order Planned Warehouse Schema and Migration

## Problem

ADR-0021 approved the planning baseline for adding `PurchaseOrder.plannedWarehouseId` with a tenant-safe composite relation. Before any schema or migration code is written, the implementation details must be reviewed at Prisma and SQL level.

This ADR proposed the exact implementation plan and acceptance criteria. The constrained schema/migration implementation is now verified. ADR-0023 separately approved and verified the internal read-only Gate 7A receiving queue. This ADR does not approve Gate 7B receiving drafts, ledger posting, or production enablement.

## Implementation Boundary

This ADR authorized and verified changes only to:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260918000000_purchase_order_planned_warehouse/migration.sql`

This ADR did not authorize changes to:

- `PurchaseOrderService`
- Purchase-order routes
- Seeds
- Gate 7A receiving queue route
- Gate 7B receiving drafts
- Ledger posting behavior
- Production configuration

## Proposed Prisma Schema Change

### `Warehouse`

Add an inverse relation with an explicit relation name:

```prisma
model Warehouse {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // existing fields omitted

  plannedPurchaseOrders PurchaseOrder[] @relation("PurchaseOrderPlannedWarehouse")

  @@unique([organizationId, id])
}
```

### `PurchaseOrder`

Add the nullable field and explicit composite relation:

```prisma
model PurchaseOrder {
  id             String              @id @default(uuid())
  organizationId String
  organization   Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  plannedWarehouseId String?
  plannedWarehouse   Warehouse? @relation(
    "PurchaseOrderPlannedWarehouse",
    fields: [organizationId, plannedWarehouseId],
    references: [organizationId, id]
  )

  // existing fields omitted

  @@index([organizationId, plannedWarehouseId, status])
}
```

Implementation notes:

- The relation name must be explicit to avoid ambiguity with `PurchaseOrder.organization` and existing `Warehouse` relations.
- `plannedWarehouseId` remains nullable in the first migration.
- `plannedWarehouseId` must not be required by Prisma validation, API contract, or service code until a separate contract/service gate is approved.
- The existing `@@unique([organizationId, id])` on `Warehouse` is required for the composite relation and already exists.

## Proposed Migration SQL

Use a new migration directory, for example:

`packages/database/prisma/migrations/2026..._purchase_order_planned_warehouse/migration.sql`

Do not edit or merge with `20260916002000_reconciliation`.

Expected SQL shape:

```sql
ALTER TABLE "PurchaseOrder"
  ADD COLUMN "plannedWarehouseId" TEXT;

ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_plannedWarehouse_fkey"
  FOREIGN KEY ("organizationId", "plannedWarehouseId")
  REFERENCES "Warehouse"("organizationId", "id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE INDEX "PurchaseOrder_organizationId_plannedWarehouseId_status_idx"
  ON "PurchaseOrder"("organizationId", "plannedWarehouseId", "status");
```

SQL requirements:

- The foreign key must be composite: `("organizationId", "plannedWarehouseId") -> "Warehouse"("organizationId", "id")`.
- The migration must be valid when `plannedWarehouseId` is null for existing rows.
- The migration must not create duplicate enum types or modify unrelated objects.
- Constraint and index names should be stable and explicit.
- The foreign key must use `ON DELETE RESTRICT`.
- The foreign key must use `ON UPDATE CASCADE` unless implementation review finds a concrete Prisma/PostgreSQL incompatibility and records a replacement decision before coding.

Final FK behavior decision:

- `ON DELETE RESTRICT` is selected because `WarehouseService.delete()` performs operational deactivation (`isActive=false`) rather than hard delete, warehouses are historical references for stock, movement, receipt, and receiving ownership, and `ON DELETE SET NULL` on a composite foreign key risks treating `organizationId` as part of the nullable relationship even though it is the purchase-order tenant owner and must not be nulled or changed.
- `ON UPDATE CASCADE` is selected for consistency with relational identity updates, while acknowledging that warehouse IDs and organization IDs should be stable in normal operation.
- Hard deleting a warehouse referenced by `PurchaseOrder.plannedWarehouseId` must fail at database level.
- Operational removal uses `Warehouse.isActive=false`, not hard delete.
- A planned warehouse may become inactive and remain referenced for historical ownership; future receiving queues must exclude inactive planned warehouses.
- The generated migration file must still be inspected before implementation approval to verify Prisma emitted this exact composite FK behavior.

Recommended final behavior:

- Prefer preserving purchase-order history over cascading delete.
- Warehouse deletion should not delete purchase orders.
- Operational warehouse deactivation should use `isActive=false`, not destructive delete.
- Purchase orders must not silently lose planned warehouse ownership because a referenced warehouse was hard deleted.

## Existing-Data Compatibility

Existing rows:

- Receive `plannedWarehouseId = NULL`.
- Continue to load through existing purchase-order list/detail/service paths.
- Are excluded from future warehouse receiving queues until assigned through an approved workflow.

Historical inactive warehouse policy:

- `plannedWarehouseId` may reference an inactive warehouse for historical purchase-order ownership.
- Existing purchase orders with inactive planned warehouses remain readable.
- Future receiving queues must join or filter on active warehouses and exclude inactive planned warehouses from operational queue results.
- Reassigning an open purchase order from an inactive warehouse to an active warehouse requires a future explicit workflow and audit event.

Existing services:

- `PurchaseOrderService.receive()` must continue to work for purchase orders where `plannedWarehouseId` is null until a later contract/service gate changes behavior.
- Existing create/update routes must not be forced to send `plannedWarehouseId` by this schema migration.
- Planned warehouse must not be required before transition to `SENT` until a separate contract/service gate is approved.

## Create/Update/Status-Transition Contract Impact

This migration gate should not change API behavior by itself.

Future contract/service gate should decide and implement:

- Whether new draft POs may omit `plannedWarehouseId`.
- Whether `plannedWarehouseId` is required before `SENT`.
- Who can set or update the field.
- Whether `PENDING_APPROVAL` or `APPROVED` changes require explicit approval.
- Immutability after `SENT` or any receipt exists.
- Audit event behavior for set/change/denial.

Baseline already approved by ADR-0021:

- `DRAFT`: authorized purchasing actor may set or change.
- `PENDING_APPROVAL` and `APPROVED`: approval-aware workflow required.
- `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`: immutable.
- Any purchase order with existing receipt history: immutable.

## Seed Fixture Impact

Initial schema implementation should not require seed updates unless seed code validates the new field.

If seed updates are needed, they must be limited to:

- Adding `plannedWarehouseId` to new purchase-order seed fixtures that represent receiving-ready POs.
- Keeping at least one existing-style null fixture to prove backwards compatibility.
- Not changing ledger, receipt, stock movement, or stock level seed behavior.

## Test Matrix

Required tests before implementation can be accepted:

| Test | Required evidence |
| --- | --- |
| Empty DB migration | `prisma migrate deploy` succeeds on disposable empty PostgreSQL. |
| Existing-data migration | `prisma migrate deploy` succeeds with existing organizations, warehouses, and purchase orders. |
| Migration history | Prisma migration history is consistent after deploy. |
| No duplicate objects | Migration does not duplicate enum types or unrelated database objects. |
| Tenant integrity | Assigning a warehouse from another organization fails at database level. |
| Valid assignment | Assigning a same-organization active warehouse succeeds. |
| Null compatibility | Existing purchase orders with null `plannedWarehouseId` can be read. |
| Existing service compatibility | Existing purchase-order list/detail and receive paths do not crash with null planned warehouse. |
| Index presence | `(organizationId, plannedWarehouseId, status)` index exists. |
| Queue readiness predicate | Future query can combine organization, planned warehouse, status, and open line quantity. |
| Referenced warehouse hard delete | Hard deleting a warehouse referenced by `PurchaseOrder.plannedWarehouseId` is rejected by the database. |
| Warehouse deactivation | Setting `Warehouse.isActive=false` succeeds even when planned purchase orders reference the warehouse. |
| Historical inactive warehouse read | Purchase orders that reference an inactive planned warehouse remain readable. |
| Inactive warehouse queue exclusion | Future receiving queue predicate excludes purchase orders whose planned warehouse is inactive. |

Optional but recommended tests:

- Prisma relation include/select for `plannedWarehouse` works.
- `Warehouse.plannedPurchaseOrders` inverse relation works.
- Migration SQL inspection confirms `ON DELETE RESTRICT` and `ON UPDATE CASCADE` on `PurchaseOrder_plannedWarehouse_fkey`.

## Forward Recovery

Preferred recovery is forward-fix because this is schema expansion.

If application behavior is wrong after deployment:

- Disable dependent feature flags.
- Leave nullable column in place.
- Ship code fix or data remediation script.
- Do not edit applied production migrations.
- Do not modify posted receipts, stock movements, or stock levels.

If the migration itself fails in disposable verification:

- Fix the migration before approval.
- Do not use production recovery processes for local disposable failures.

If an applied production migration later needs correction:

- Create an explicit recovery plan and new forward migration.
- Do not rewrite applied migration files.

## Rollback Or Disable Strategy

Before production data depends on the field:

- Dependent code can be disabled by not enabling Gate 7A.
- Existing routes keep ignoring `plannedWarehouseId`.
- A future drop-column migration may be proposed only if no dependent data or code exists.

After data depends on the field:

- Do not drop the column as rollback.
- Preserve field for audit and queue correctness.
- Use forward migration or remediation workflow.

## Verification Evidence

Implementation files:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260918000000_purchase_order_planned_warehouse/migration.sql`

Migration SQL was manually inspected and contains:

```sql
ALTER TABLE "PurchaseOrder"
  ADD COLUMN "plannedWarehouseId" TEXT;

ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_plannedWarehouse_fkey"
  FOREIGN KEY ("organizationId", "plannedWarehouseId")
  REFERENCES "Warehouse"("organizationId", "id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE INDEX "PurchaseOrder_organizationId_plannedWarehouseId_status_idx"
  ON "PurchaseOrder"("organizationId", "plannedWarehouseId", "status");
```

Dedicated disposable PostgreSQL verification passed:

- Empty database `prisma migrate deploy` passed.
- Existing-data database `prisma migrate deploy` passed with existing organization, warehouses, supplier, user, product, purchase order, and purchase-order line.
- Migration history was consistent after deploy.
- Composite FK inspection confirmed `PurchaseOrder(organizationId, plannedWarehouseId) -> Warehouse(organizationId, id)`.
- FK action inspection confirmed `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
- Index inspection confirmed `PurchaseOrder_organizationId_plannedWarehouseId_status_idx`.
- Cross-tenant planned warehouse assignment was rejected by the database.
- Referenced warehouse hard delete was rejected by the database.
- Warehouse deactivation via `isActive=false` succeeded.
- Purchase order with inactive planned warehouse remained readable.
- Future queue-style predicate excluded inactive planned warehouse.
- Existing purchase order with `plannedWarehouseId = NULL` remained readable.

Service and harness verification passed:

- Existing `PurchaseOrderService` integration flow passed after migration.
- Full API Jest suite passed after closing stale Prisma singleton import ordering.
- The inventory integration suite now imports runtime Prisma singleton and services only after the disposable database is started, `DATABASE_URL` is set, and migrations are applied.

Quality gates passed:

- `pnpm --filter @stokku/api exec jest --runInBand`: 41 suites passed, 2 suites skipped by environment guards; 204 tests passed, 10 tests skipped.
- `pnpm --filter @stokku/database exec prisma validate`.
- `pnpm --filter @stokku/api typecheck`.
- `pnpm --filter @stokku/api build`.
- `pnpm --filter @stokku/database lint`.
- `pnpm --filter @stokku/api lint` with pre-existing warnings only.
- `pnpm docs:check`.
- `git diff --check` with line-ending warnings only.

Skipped-suite classification:

- `apps/api/src/__tests__/health.integration.test.ts`: skipped by environment guard unless `RUN_DATABASE_INTEGRATION_TESTS=true` and database credentials are configured. This is environment-dependent and not migration verification evidence.
- `apps/api/src/target-authorization/authorization-parity.integration.test.ts`: skipped by environment guard unless a local disposable database URL and integration flag are available. This is environment-dependent and not migration verification evidence.

Do not report skipped suites as passed. The correct full-suite summary for this gate is: 41 suites passed, 2 suites skipped due to environment guards, 204 tests passed, 10 tests skipped.

## Acceptance Criteria For Future Related Implementation

Any future code depending on this schema must still satisfy all of the following:

- Exact Prisma relation and inverse relation are agreed.
- Exact migration SQL is reviewed and includes the composite foreign key.
- Delete/update behavior for the FK is explicitly `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
- Migration name is new and separate from `20260916002000_reconciliation`.
- Empty and existing-data disposable migration tests are defined.
- Tenant-integrity database test is defined.
- Null-read compatibility test is defined.
- Existing service compatibility test is defined.
- Referenced-warehouse hard-delete rejection test is defined.
- Warehouse deactivation success test is defined.
- Historical inactive planned warehouse read test is defined.
- Inactive planned warehouse queue exclusion test is defined.
- Seed impact is documented.
- Forward recovery and rollback/disable strategy are documented.
- Production enablement remains NO-GO.

## Consequences

- ADR-0022 verified the constrained schema/migration implementation, not Gate 7A.
- Gate 7A receiving queue was separately approved and verified by ADR-0023 for
  internal read-only use; it remains disabled in production.
- Gate 7B and ledger posting remain separate future gates.
- Production remains NO-GO.
