# ADR-0028: Receiving Draft Persistence Implementation Proposal

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Database Architecture, Backend, Security, Principal Engineering, QA, Product

## Related ADRs

- ADR-0003: Tenant and Warehouse Authorization
- ADR-0005: Inventory Ledger and Projection
- ADR-0007: API Versioning and Command Contract
- ADR-0009: Migration, Backup, and Recovery Strategy
- ADR-0015: Append-Only Ledger and Audit Controls
- ADR-0019: Receiving Workflow Boundary
- ADR-0020: Purchase-Order Receiving Warehouse Ownership
- ADR-0021: Purchase-Order Planned Warehouse Schema and Migration
- ADR-0022: Planned Warehouse Schema Implementation and Migration
- ADR-0023: Warehouse-Scoped Receiving Queue
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands

## Problem

ADR-0024 defines the receiving-draft workflow and ADR-0025 defines the conceptual
schema and idempotency direction, but neither locks the exact Prisma models,
PostgreSQL migration SQL, constraint names, index set, or verification matrix.
Without that precision, implementation cannot be reviewed for tenant safety,
warehouse-scope integrity, idempotent replay, optimistic concurrency, audit
transactionality, or rollback behavior.

Gate 7B also leaves eight implementation blockers open from ADR-0025:

- Exact Prisma schema and migration SQL.
- Whether `POSTING` is persisted or transient.
- In-flight idempotency duplicate behavior.
- Exact canonical hashing algorithm.
- Exact optimistic concurrency API contract.
- Whether destination bin is required in the first implementation.
- Over-receipt policy.
- Same-user create and approve policy.

This ADR proposes the exact persistence implementation plan for the pre-posting
draft slice only. It does not authorize code, migration, route, service,
permission, seed, feature-flag, or production changes.

## Context

Current verified persistence facts:

- `PurchaseOrder.plannedWarehouseId` is nullable with a tenant-safe composite FK
  `PurchaseOrder(organizationId, plannedWarehouseId) -> Warehouse(organizationId, id)`,
  `ON DELETE RESTRICT`, `ON UPDATE CASCADE`.
- `Warehouse` has `@@unique([organizationId, id])`.
- `OrganizationMember` has `@@unique([organizationId, id])` and
  `@@unique([organizationId, userId])`.
- `PurchaseOrder` has no `@@unique([organizationId, id])`, so a composite FK from
  a draft to `(organizationId, purchaseOrderId)` has no database target today.
- `PurchaseOrderItem` has no `@@unique([purchaseOrderId, id])`, so a draft line
  cannot prove parent-PO ownership at the database level today.
- `GoodsReceipt` / `GoodsReceiptLine` remain immutable posted evidence with
  `GoodsReceiptStatus` of only `POSTED` and `REVERSED`.
- `AuditLog` is append-only via `prevent_audit_log_mutation()` trigger.
- `StockMovement` is append-only via `prevent_stock_movement_mutation()` trigger.
- There is no `ReceivingDraft`, `ReceivingDraftLine`, or `IdempotencyCommand`
  table.
- Prisma cannot express partial unique indexes or `CHECK` constraints; those must
  be raw SQL in the migration and explicitly reviewed.
- ADR-0026 (planned-warehouse authoring) and ADR-0027 (target inbound
  authorization policy) are proposed prerequisites and are not implemented.
- Production remains NO-GO.

Ledger boundary for this proposal:

- No `GoodsReceipt`, `GoodsReceiptLine`, `StockMovement`, `StockLevel`,
  `PurchaseOrderItem.receivedQty`, `PurchaseOrder.status`, putaway-task, or
  document-sequence write.
- No receipt posting, no stock projection change, no ledger effect.

## Alternatives

### Alternative 1: Reuse `GoodsReceipt` as the draft table

Pros:

- Fewer new tables.
- Receipt-line shape looks superficially reusable.

Cons:

- Overloads immutable posted evidence with mutable workflow states.
- Requires widening `GoodsReceiptStatus` beyond `POSTED` / `REVERSED`.
- Makes reversal, correction, and audit semantics ambiguous.
- Couples draft permissions to posting permissions.

Decision:

- Rejected. ADR-0019 and ADR-0024 already reject this.

### Alternative 2: Store draft state on `PurchaseOrder` / `PurchaseOrderItem`

Pros:

- Minimal schema surface.
- No new aggregate.

Cons:

- Mixes commercial intent with warehouse execution.
- Cannot represent counted / accepted / rejected / exception quantities per review
  cycle.
- Cannot coordinate concurrent drafts or idempotent commands per transition.
- Approval invalidation and separation of duties have no durable home.

Decision:

- Rejected.

### Alternative 3: Separate draft aggregate with single-column FKs only

Pros:

- Simple Prisma relations (`purchaseOrderId -> PurchaseOrder.id`,
  `warehouseId -> Warehouse.id`).
- Easy to generate via `prisma migrate dev` without hand-written SQL.

Cons:

- Single-column FKs do not prove tenant equality at the database level.
- Draft warehouse can diverge from `PurchaseOrder.plannedWarehouseId` without a
  database error.
- Draft lines can reference a PO item from a different PO than the parent draft.
- Cross-tenant or cross-PO misbinding is caught only if every service path
  repeats the same application check.

Decision:

- Rejected. This reproduces the exact data-scope failure ADR-0020 rejected for
  the queue.

### Alternative 4: Separate aggregate with composite tenant-safe FKs, CHECKs, and a partial active-draft index

Pros:

- Database rejects cross-tenant warehouse, cross-PO line, and null-destination
  draft creation even if application code has a bug.
- Draft warehouse equality with `plannedWarehouseId` is declarative, not
  conventional.
- Quantity invariants (`accepted + rejected = counted`, non-negative, reason
  coherence) hold for every writer, including future workers and remediation
  scripts.
- One active draft per PO is enforced without application-level race windows.
- Idempotency claim is a unique database row, so replay and mismatch-conflict
  behavior is testable.

Cons:

- Requires new unique constraints on `PurchaseOrder` and `PurchaseOrderItem` as
  FK targets.
- Requires hand-reviewed raw SQL for `CHECK`s and the partial unique index.
- Requires explicit Prisma relation names and inverse relations.
- Requires disposable empty-database and existing-data migration tests.

Decision:

- Selected proposal direction.

### Alternative 5: Introduce an external workflow engine for draft orchestration

Pros:

- Durable timers, retries, and visibility may help complex inbound flows later.

Cons:

- Adds runtime, deployment, secret-management, and consistency-design burden.
- Database state and workflow history can diverge.
- Unnecessary for the first pre-posting draft slice.

Decision:

- Deferred. Revisit only after the database-backed draft slice is proven.

## Decision

Propose a pre-posting persistence slice with three new logical tables,
supporting unique constraints on existing parents, five draft states, three
idempotency states, composite FKs, `CHECK`s, operational indexes, and one
partial active-draft index. This is a proposal only.

### Scope Lock

Persisted draft states in this slice:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `VOIDED`

Explicitly not persisted in this slice:

- `POSTING`: transient in-memory only. A future posting ADR decides whether a
  durable posting-attempt record is needed.
- `POSTED` / `FAILED`: belong to the separate ledger/posting gate with their own
  migration. No `postedById`, `postingStartedAt`, `postedAt`, `failedAt`,
  `failureCode`, or `failureRetryable` columns are added now.

Explicitly not added in this slice:

- `destinationBinId`: deferred. Bin identity resolves through
  `WarehouseBin -> WarehouseZone -> Warehouse` and belongs to the future
  putaway/posting design. Adding a nullable bin column now would create a
  mismatch invariant the database cannot enforce simply.
- Duplicated `productId` / `variantId` on draft lines: deferred. Product and
  variant are derived from the referenced `PurchaseOrderItem`. Storing copies
  creates a second source of truth with no simple database guard.
- `FAILED_RETRYABLE`: deferred. All Gate 7B draft commands are atomic database
  transactions with no external side effects. Unexpected infrastructure failure
  rolls back both the domain mutation and the idempotency claim, so the same
  key can be safely retried. Retryable posting failure belongs to the posting
  gate.

Over-receipt policy for this slice:

- `DENY`. No tolerance, no supervisor override.
- `acceptedQuantity` must not exceed the live open quantity
  (`PurchaseOrderItem.quantity - PurchaseOrderItem.receivedQty`) at execution
  time under a serializable transaction with row locks.
- The database enforces non-negative quantities and the
  `accepted + rejected = counted` invariant; the application enforces the
  open-quantity ceiling because `receivedQty` changes as legacy direct receipts
  occur.

Same-user policy for this slice:

- The creator membership cannot approve or reject its own draft.
- ADR-0027 additionally forbids any effective role bundle from combining
  create/update/submit with approve/reject. The persistence proposal supports
  that rule by storing membership (not bare user) actor references; enforcement
  itself is application-level and tested, not a database `CHECK`.

### Proposed Prisma Schema Change

New enums:

```prisma
enum ReceivingDraftStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  VOIDED
}

enum IdempotencyCommandStatus {
  IN_PROGRESS
  SUCCEEDED
  FAILED_FINAL
}
```

Supporting parent uniques (additive only, no behavior change by themselves):

```prisma
model PurchaseOrder {
  // ... existing fields ...

  @@unique([organizationId, id], map: "PurchaseOrder_organizationId_id_key")
  @@unique([organizationId, id, plannedWarehouseId], map: "PurchaseOrder_organizationId_id_plannedWarehouse_key")
}

model PurchaseOrderItem {
  // ... existing fields ...

  @@unique([purchaseOrderId, id], map: "PurchaseOrderItem_purchaseOrderId_id_key")
}
```

Notes:

- `(organizationId, id, plannedWarehouseId)` is unique because `id` is already
  the primary key; adding it only creates a composite FK target. PostgreSQL
  treats `NULL` planned values as distinct, which is safe here because a draft
  always carries a non-null warehouse and therefore can never join to a
  null-destination PO.
- No existing column is altered, renamed, or dropped.

New models (exact field set proposed):

```prisma
model ReceivingDraft {
  id             String              @id @default(uuid())
  organizationId String
  organization   Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  warehouseId String
  warehouse   Warehouse @relation(
    "ReceivingDraftWarehouse",
    fields: [organizationId, warehouseId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_warehouse_fkey"
  )

  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(
    "ReceivingDraftPurchaseOrder",
    fields: [organizationId, purchaseOrderId, warehouseId],
    references: [organizationId, id, plannedWarehouseId],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_purchaseOrder_fkey"
  )

  status                    ReceivingDraftStatus @default(DRAFT)
  supplierDeliveryReference String?              @db.VarChar(200)

  createdByMembershipId   String
  createdByMembership     OrganizationMember @relation(
    "ReceivingDraftCreatedBy",
    fields: [organizationId, createdByMembershipId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_createdBy_fkey"
  )
  submittedByMembershipId String?
  submittedByMembership   OrganizationMember? @relation(
    "ReceivingDraftSubmittedBy",
    fields: [organizationId, submittedByMembershipId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_submittedBy_fkey"
  )
  approvedByMembershipId  String?
  approvedByMembership    OrganizationMember? @relation(
    "ReceivingDraftApprovedBy",
    fields: [organizationId, approvedByMembershipId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_approvedBy_fkey"
  )
  rejectedByMembershipId  String?
  rejectedByMembership    OrganizationMember? @relation(
    "ReceivingDraftRejectedBy",
    fields: [organizationId, rejectedByMembershipId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_rejectedBy_fkey"
  )
  voidedByMembershipId    String?
  voidedByMembership      OrganizationMember? @relation(
    "ReceivingDraftVoidedBy",
    fields: [organizationId, voidedByMembershipId],
    references: [organizationId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraft_voidedBy_fkey"
  )

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  submittedAt DateTime?
  approvedAt  DateTime?
  rejectedAt  DateTime?
  voidedAt    DateTime?

  rejectionReason String? @db.VarChar(500)
  voidReason      String? @db.VarChar(500)
  version         Int     @default(1)

  lines ReceivingDraftLine[] @relation("ReceivingDraftLines")

  @@unique([organizationId, id], map: "ReceivingDraft_organizationId_id_key")
  @@unique([organizationId, id, purchaseOrderId], map: "ReceivingDraft_organizationId_id_purchaseOrder_key")
  @@unique([organizationId, id, warehouseId], map: "ReceivingDraft_organizationId_id_warehouse_key")
  @@index([organizationId, warehouseId, status, updatedAt], map: "ReceivingDraft_org_warehouse_status_updated_idx")
  @@index([organizationId, purchaseOrderId, status], map: "ReceivingDraft_org_po_status_idx")
  @@index([organizationId, status, updatedAt], map: "ReceivingDraft_org_status_updated_idx")
  @@index([organizationId, createdByMembershipId, updatedAt], map: "ReceivingDraft_org_creator_updated_idx")
}

model ReceivingDraftLine {
  id             String       @id @default(uuid())
  organizationId String

  receivingDraftId String
  receivingDraft   ReceivingDraft @relation(
    "ReceivingDraftLines",
    fields: [organizationId, receivingDraftId, purchaseOrderId],
    references: [organizationId, id, purchaseOrderId],
    onDelete: Cascade,
    onUpdate: Cascade,
    map: "ReceivingDraftLine_draft_fkey"
  )

  purchaseOrderId     String
  purchaseOrderItemId String
  purchaseOrderItem   PurchaseOrderItem @relation(
    fields: [purchaseOrderId, purchaseOrderItemId],
    references: [purchaseOrderId, id],
    onDelete: Restrict,
    onUpdate: Cascade,
    map: "ReceivingDraftLine_poItem_fkey"
  )

  countedQuantity  Decimal @db.Decimal(18, 6)
  acceptedQuantity Decimal @db.Decimal(18, 6)
  rejectedQuantity Decimal @default(0) @db.Decimal(18, 6)
  exceptionReason  String? @db.VarChar(500)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  version   Int      @default(1)

  @@unique([organizationId, receivingDraftId, purchaseOrderItemId], map: "ReceivingDraftLine_draft_poItem_key")
  @@index([organizationId, receivingDraftId], map: "ReceivingDraftLine_org_draft_idx")
  @@index([organizationId, purchaseOrderItemId], map: "ReceivingDraftLine_org_poItem_idx")
}

model IdempotencyCommand {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  commandName    String                  @db.VarChar(120)
  idempotencyKey String                  @db.VarChar(128)
  requestHash    String                  @db.VarChar(64)
  status         IdempotencyCommandStatus @default(IN_PROGRESS)
  responseStatus Int?
  resultResourceId String?               @db.VarChar(64)
  resultBody     Json?
  attemptCount   Int                     @default(1)
  safeErrorCode  String?                 @db.VarChar(80)

  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, commandName, idempotencyKey], map: "IdempotencyCommand_org_command_key")
  @@index([organizationId, status, expiresAt], map: "IdempotencyCommand_org_status_expires_idx")
  @@index([expiresAt], map: "IdempotencyCommand_expires_idx")
}
```

Required inverse relations (explicit names, additive only):

- `Organization.receivingDrafts`, `Organization.idempotencyCommands`.
- `Warehouse.receivingDrafts` under `ReceivingDraftWarehouse`.
- `PurchaseOrder.receivingDrafts` under `ReceivingDraftPurchaseOrder`.
- `OrganizationMember` created/submitted/approved/rejected/voided draft lists
  under the five relation names above.

Implementation notes:

- All tenant FKs are composite `(organizationId, ...)` except the
  `PurchaseOrderItem(purchaseOrderId, id)` target, which is already scoped to
  its parent PO; the draft-line-to-draft FK carries `organizationId` and
  `purchaseOrderId` so the line cannot escape its parent's tenant or PO.
- `ReceivingDraftLine` intentionally has no direct `Warehouse` FK; warehouse
  scope is inherited from its parent draft.
- `commandName` is `String`, not an enum, so future commands do not require an
  enum migration. The application allowlists exact command names.
- `resultBody` is `Json?` (`JSONB` in PostgreSQL) and stores only the
  allowlisted DTO needed for replay, never secrets, headers, or raw ORM rows.
- Actor columns reference `OrganizationMember`, not bare `User`, so tenant
  integrity is declarative per ADR-0027.

### Proposed Migration SQL Shape

Use a new forward-only migration directory, for example:

`packages/database/prisma/migrations/20260919000000_receiving_draft_persistence/migration.sql`

Do not edit, merge with, or regenerate any applied migration, including
`20260916002000_reconciliation` and
`20260918000000_purchase_order_planned_warehouse`.

Expected SQL shape (names must match the Prisma proposal exactly):

```sql
CREATE TYPE "ReceivingDraftStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VOIDED');
CREATE TYPE "IdempotencyCommandStatus" AS ENUM ('IN_PROGRESS', 'SUCCEEDED', 'FAILED_FINAL');

CREATE UNIQUE INDEX "PurchaseOrder_organizationId_id_key"
  ON "PurchaseOrder"("organizationId", "id");
CREATE UNIQUE INDEX "PurchaseOrder_organizationId_id_plannedWarehouse_key"
  ON "PurchaseOrder"("organizationId", "id", "plannedWarehouseId");
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_id_key"
  ON "PurchaseOrderItem"("purchaseOrderId", "id");

CREATE TABLE "ReceivingDraft" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "status" "ReceivingDraftStatus" NOT NULL DEFAULT 'DRAFT',
  "supplierDeliveryReference" VARCHAR(200),
  "createdByMembershipId" TEXT NOT NULL,
  "submittedByMembershipId" TEXT,
  "approvedByMembershipId" TEXT,
  "rejectedByMembershipId" TEXT,
  "voidedByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "rejectionReason" VARCHAR(500),
  "voidReason" VARCHAR(500),
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "ReceivingDraft_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReceivingDraft_version_check" CHECK ("version" > 0),
  CONSTRAINT "ReceivingDraft_rejected_reason_check" CHECK (
    "status" <> 'REJECTED' OR ("rejectionReason" IS NOT NULL AND char_length("rejectionReason") > 0)
  ),
  CONSTRAINT "ReceivingDraft_void_reason_check" CHECK (
    "status" <> 'VOIDED' OR ("voidReason" IS NOT NULL AND char_length("voidReason") > 0)
  )
);

CREATE TABLE "ReceivingDraftLine" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "receivingDraftId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "purchaseOrderItemId" TEXT NOT NULL,
  "countedQuantity" DECIMAL(18,6) NOT NULL,
  "acceptedQuantity" DECIMAL(18,6) NOT NULL,
  "rejectedQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "exceptionReason" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "ReceivingDraftLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReceivingDraftLine_version_check" CHECK ("version" > 0),
  CONSTRAINT "ReceivingDraftLine_non_negative_check" CHECK (
    "countedQuantity" >= 0 AND "acceptedQuantity" >= 0 AND "rejectedQuantity" >= 0
  ),
  CONSTRAINT "ReceivingDraftLine_sum_check" CHECK (
    "acceptedQuantity" + "rejectedQuantity" = "countedQuantity"
  ),
  CONSTRAINT "ReceivingDraftLine_exception_check" CHECK (
    ("rejectedQuantity" = 0 AND "exceptionReason" IS NULL)
    OR ("rejectedQuantity" > 0 AND "exceptionReason" IS NOT NULL AND char_length("exceptionReason") > 0)
  )
);

CREATE TABLE "IdempotencyCommand" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "commandName" VARCHAR(120) NOT NULL,
  "idempotencyKey" VARCHAR(128) NOT NULL,
  "requestHash" VARCHAR(64) NOT NULL,
  "status" "IdempotencyCommandStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "responseStatus" INTEGER,
  "resultResourceId" TEXT,
  "resultBody" JSONB,
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "safeErrorCode" VARCHAR(80),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyCommand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IdempotencyCommand_attempt_check" CHECK ("attemptCount" >= 1),
  CONSTRAINT "IdempotencyCommand_hash_check" CHECK (char_length("requestHash") = 64)
);
```

FK, index, and partial-index shape:

```sql
ALTER TABLE "ReceivingDraft" ADD CONSTRAINT "ReceivingDraft_warehouse_fkey"
  FOREIGN KEY ("organizationId", "warehouseId")
  REFERENCES "Warehouse"("organizationId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReceivingDraft" ADD CONSTRAINT "ReceivingDraft_purchaseOrder_fkey"
  FOREIGN KEY ("organizationId", "purchaseOrderId", "warehouseId")
  REFERENCES "PurchaseOrder"("organizationId", "id", "plannedWarehouseId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReceivingDraft" ADD CONSTRAINT "ReceivingDraft_createdBy_fkey"
  FOREIGN KEY ("organizationId", "createdByMembershipId")
  REFERENCES "OrganizationMember"("organizationId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
-- Repeat for submittedBy / approvedBy / rejectedBy / voidedBy with their constraint names.

ALTER TABLE "ReceivingDraftLine" ADD CONSTRAINT "ReceivingDraftLine_draft_fkey"
  FOREIGN KEY ("organizationId", "receivingDraftId", "purchaseOrderId")
  REFERENCES "ReceivingDraft"("organizationId", "id", "purchaseOrderId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReceivingDraftLine" ADD CONSTRAINT "ReceivingDraftLine_poItem_fkey"
  FOREIGN KEY ("purchaseOrderId", "purchaseOrderItemId")
  REFERENCES "PurchaseOrderItem"("purchaseOrderId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IdempotencyCommand" ADD CONSTRAINT "IdempotencyCommand_organization_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ReceivingDraft_organizationId_id_key"
  ON "ReceivingDraft"("organizationId", "id");
CREATE UNIQUE INDEX "ReceivingDraft_organizationId_id_purchaseOrder_key"
  ON "ReceivingDraft"("organizationId", "id", "purchaseOrderId");
CREATE UNIQUE INDEX "ReceivingDraft_organizationId_id_warehouse_key"
  ON "ReceivingDraft"("organizationId", "id", "warehouseId");

CREATE UNIQUE INDEX "ReceivingDraft_one_active_per_po_idx"
  ON "ReceivingDraft"("organizationId", "purchaseOrderId")
  WHERE "status" IN ('DRAFT', 'SUBMITTED', 'APPROVED');

CREATE INDEX "ReceivingDraft_org_warehouse_status_updated_idx"
  ON "ReceivingDraft"("organizationId", "warehouseId", "status", "updatedAt" DESC);
CREATE INDEX "ReceivingDraft_org_po_status_idx"
  ON "ReceivingDraft"("organizationId", "purchaseOrderId", "status");
CREATE INDEX "ReceivingDraft_org_status_updated_idx"
  ON "ReceivingDraft"("organizationId", "status", "updatedAt" DESC);
CREATE INDEX "ReceivingDraft_org_creator_updated_idx"
  ON "ReceivingDraft"("organizationId", "createdByMembershipId", "updatedAt" DESC);

CREATE UNIQUE INDEX "ReceivingDraftLine_draft_poItem_key"
  ON "ReceivingDraftLine"("organizationId", "receivingDraftId", "purchaseOrderItemId");
CREATE INDEX "ReceivingDraftLine_org_draft_idx"
  ON "ReceivingDraftLine"("organizationId", "receivingDraftId");
CREATE INDEX "ReceivingDraftLine_org_poItem_idx"
  ON "ReceivingDraftLine"("organizationId", "purchaseOrderItemId");

CREATE UNIQUE INDEX "IdempotencyCommand_org_command_key"
  ON "IdempotencyCommand"("organizationId", "commandName", "idempotencyKey");
CREATE INDEX "IdempotencyCommand_org_status_expires_idx"
  ON "IdempotencyCommand"("organizationId", "status", "expiresAt");
CREATE INDEX "IdempotencyCommand_expires_idx"
  ON "IdempotencyCommand"("expiresAt");
```

SQL requirements:

- Composite FKs must match the Prisma proposal name-for-name.
- `ReceivingDraft` parent FKs use `ON DELETE RESTRICT`; lines cascade only from
  their parent draft.
- The partial active-draft index is raw SQL; Prisma schema documents the rule in
  comments because Prisma cannot express it.
- `CHECK`s must match the Prisma proposal; no additional silent constraints.
- The migration must create no duplicate enum types and touch no unrelated
  table.
- The generated migration file must be manually inspected before any
  implementation approval to verify Prisma emitted exactly this behavior.

### Idempotency Proposal

Uniqueness:

- `(organizationId, commandName, idempotencyKey)`.

Lifecycle in this slice:

- `IN_PROGRESS`: claim inserted at the start of the serializable transaction.
- `SUCCEEDED`: domain transition plus allowlisted result committed together.
- `FAILED_FINAL`: sanitized business failure (validation, state, scope,
  idempotency mismatch) committed as the replayable result without a domain
  transition. Unexpected infrastructure failure rolls back the whole
  transaction, including the claim, so the same key can be safely retried.

Replay rules:

- Same key plus same canonical `requestHash` returns the stored result without
  repeating the transition.
- Same key plus different `requestHash` returns `409 IDEMPOTENCY_KEY_REUSED`
  without a state change.
- In-flight duplicate blocks on the unique row lock with a bounded wait
  (proposal: `lock_timeout = 3s`). If the first transaction commits, replay its
  result. If the bounded wait times out, return `409 CONFLICT` with no state
  change and safe retry guidance. Never execute the transition twice.

Canonical hashing proposal:

1. Validate and normalize through the strict command schema first.
2. Normalize decimals to fixed `Decimal(18,6)` plain strings (`toFixed(6)`, no
   exponent), so `10`, `10.0`, and `10.000000` hash identically.
3. Recursively sort object keys.
4. UTF-8 canonical JSON, SHA-256, lowercase hex (64 characters).
5. Include: command name, actor organization ID, actor membership ID, draft or
   PO ID, warehouse ID, expected version where applicable, normalized semantic
   body.
6. Exclude: the idempotency key itself, bearer tokens, cookies, request ID, IP
   address, user agent, and all other transport metadata.

Retention proposal:

- `expiresAt` defaults to creation plus 30 days, set by the application.
- No automatic database expiry. A future retention ADR defines an explicit
  cleanup job. Rows needed for audit or dispute handling must not disappear
  silently.

### Concurrency Proposal

- Every draft and draft line carries `version Int @default(1)` with
  `CHECK (version > 0)`.
- Every update and transition request carries a required positive integer
  `expectedVersion`.
- The service executes a conditional update
  (`WHERE id = ? AND version = ?`) inside a serializable transaction, then
  increments the parent draft version.
- Expected-version mismatch returns `409 CONFLICT` with no state change.
- Serialization, deadlock, or unique-violation retry uses a bounded policy
  (proposal: up to 3 attempts with bounded backoff). Exhaustion returns
  `409 CONCURRENCY_RETRY_EXHAUSTED`.
- The partial active-draft index guarantees at most one non-terminal draft per
  PO even under concurrent creates; the loser receives a deterministic unique
  conflict mapped to `409 CONFLICT`.

### Authorization And Audit Hooks

This ADR adds persistence support only and changes no authorization behavior:

- Actor columns support the ADR-0027 membership-authority model.
- Warehouse and PO FKs support exact warehouse-scope checks.
- Quantity and reason `CHECK`s support least-privilege review without trusting
  the caller.
- Every successful command must still write its `AuditLog` row in the same
  transaction as the draft/line version bump and idempotency result, using the
  event names from ADR-0024 / ADR-0026 / ADR-0027.
- Best-effort authorization-denial logging never substitutes for transactional
  mutation audit.

### Existing-Data Compatibility

- Existing organizations, users, memberships, warehouses, POs, PO lines,
  receipts, stock, and audit rows are untouched.
- New tables start empty; no backfill of historical direct receipts into drafts.
- New parent unique indexes are additive and must succeed on existing data
  because they are implied by existing primary keys.
- Existing `PurchaseOrderService` list/detail/receive paths must continue to
  work with no code change under this persistence proposal alone.
- Seed changes, if any, are limited to local/dev fixtures and must keep at
  least one null-destination PO to prove backward compatibility. No production
  seed change is proposed.

## Implementation Blockers Remaining

Even after this persistence proposal is approved, implementation remains blocked
until a separate approval locks:

- Target authorization-policy storage and migration from ADR-0027.
- Purchase-order authoring contract implementation from ADR-0026.
- Exact API contracts for every draft command (create, read, update, submit,
  approve, reject, void) with strict schemas, DTO allowlists, and error codes.
- Feature flag name, default, registration, and production fail-closed guard.
- Runtime permission allowlist update plan.
- Disposable PostgreSQL migration and integration test plan execution.
- Security review.
- Production impact review.

## Test Matrix Proposal

Migration tests (disposable PostgreSQL, empty and existing-data):

- Empty-database `prisma migrate deploy` succeeds and history is consistent.
- Existing-data `prisma migrate deploy` succeeds with organizations, users,
  memberships, warehouses, POs, PO lines, receipts, and null planned warehouses.
- No duplicate enum or unrelated object is created.
- Cross-tenant draft warehouse assignment fails at the database level.
- Draft against a null-destination PO fails at the database level.
- Draft warehouse differing from PO planned warehouse fails at the database
  level.
- Draft line referencing a PO item from another PO fails at the database level.
- Duplicate active draft for one PO fails on the partial unique index; a new
  draft after `REJECTED` or `VOIDED` succeeds.
- Quantity `CHECK`s reject negative values, sum mismatch, and rejected quantity
  without a reason.
- Reason `CHECK`s reject `REJECTED` without a rejection reason and `VOIDED`
  without a void reason.
- Idempotency unique key rejects a second command name/key pair collision.
- Referenced warehouse, PO, PO item, and actor membership hard deletes are
  rejected per the `RESTRICT` matrix; draft-line cascade from a deleted draft
  is verified only for local/dev cleanup semantics.
- Append-only `AuditLog` protections remain effective.

Integration tests required before any implementation approval (disposable
PostgreSQL):

- Tenant isolation, warehouse scoping, inactive identity, inactive membership,
  revoked/expired session, unknown/wildcard grant denial.
- Creator self-approval/rejection denial, including via custom role.
- Every allowed and forbidden state transition.
- Same-key replay, same-key different-payload conflict, concurrent duplicate
  bounded-wait behavior.
- Stale `expectedVersion` conflict and stale PO open-quantity conflict.
- Transactional audit commit and rollback.
- Proof of zero writes to receipts, lines, movements, levels, ledger, PO
  received quantities, PO statuses, putaway tasks, and document sequences.
- Feature-flag-off `404 NOT_FOUND` and production fail-closed startup.

## Forward Recovery

Preferred recovery is forward-fix because this is additive expansion:

- If application behavior is wrong after deployment, disable the dependent
  feature flag, leave tables and constraints in place, and ship a code fix or
  approved remediation script.
- Do not edit applied production migrations.
- Do not delete or mutate posted receipts, movements, levels, or audit rows.
- If the migration itself fails in disposable verification, fix the proposal
  before approval. Disposable failures never use production recovery processes.
- If an applied production migration later needs correction, create an explicit
  recovery plan and a new forward migration.

## Rollback Or Disable Strategy

Before any production data depends on the new tables:

- Dependent code stays disabled behind its feature flag.
- Existing routes ignore the new tables.
- A drop-table migration may be proposed only if no dependent data or code
  exists and it receives its own ADR and review.

After data depends on the new tables:

- Do not drop tables or columns as rollback.
- Preserve drafts and idempotency rows for audit and operator recovery.
- Use forward migration or an approved remediation workflow.

## Verification Evidence

None yet. This ADR is a proposal only. Evidence will be recorded here only after
a separate implementation approval authorizes schema, migration, service, route,
and test changes and disposable verification passes.

## Acceptance Criteria For Future Implementation

- Exact Prisma models, enums, relation names, maps, uniques, and indexes match
  this proposal.
- Exact migration SQL, constraint names, FK actions, `CHECK`s, indexes, and the
  partial active-draft index match this proposal.
- Empty and existing-data disposable migration tests pass.
- Tenant-integrity, null-destination, warehouse-equality, line-parentage,
  active-draft uniqueness, quantity, reason, and idempotency-unique tests pass.
- Existing service compatibility tests pass with no change to
  `PurchaseOrderService.receive()` or Gate 7A read behavior.
- Seed impact, forward recovery, and rollback/disable strategy are documented.
- Authorization-policy, API-contract, feature-flag, permission-allowlist,
  security-review, and production-impact approvals are separately recorded.
- Production enablement remains NO-GO.

## Consequences

- Gate 7B gains an exact, reviewable persistence proposal without authorizing
  implementation.
- Tenant, warehouse, PO-parentage, quantity, reason, idempotency, and
  active-draft uniqueness rules move from convention to database enforcement.
- `POSTING` transience, destination-bin deferral, over-receipt denial, and
  same-user separation are explicitly locked for the first slice.
- Ledger posting remains a separate future gate.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- Changes to `packages/database/prisma/schema.prisma`.
- Changes to `packages/database/prisma/migrations/**`.
- Runtime permission allowlist changes.
- Receiving mutation endpoints or services.
- Draft create/update/submit/approve/reject/void implementation.
- Receipt posting, stock movement creation, or stock-level updates.
- Ledger entries or reversals.
- Seed changes.
- Feature flag changes.
- Production configuration changes.
- Any change to `PurchaseOrderService.receive()`.
- Any change to Gate 7A read-only behavior.
- Production enablement.
