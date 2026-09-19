# ADR-0026: Purchase-Order Planned Warehouse Authoring

## Status

Proposed for Gate 7B prerequisite review; implementation not approved

## Date

2026-09-19

## Owners

Product, Principal Engineering, Backend, Security, Database Architecture, QA

## Related ADRs

- ADR-0003: Tenant and Warehouse Authorization
- ADR-0007: API Versioning and Command Contract
- ADR-0009: Migration, Backup, and Recovery Strategy
- ADR-0019: Receiving Workflow Boundary
- ADR-0020: Purchase-Order Receiving Warehouse Ownership
- ADR-0021: Purchase-Order Planned Warehouse Schema and Migration
- ADR-0022: Planned Warehouse Schema Implementation and Migration
- ADR-0023: Warehouse-Scoped Receiving Queue
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design

## Problem

ADR-0022 added and verified the nullable, tenant-safe
`PurchaseOrder.plannedWarehouseId` relation. The reference purchase-order create,
status-transition, and direct-receive paths do not author or enforce that field:

- Normal purchase-order creation cannot supply a planned warehouse.
- The current lifecycle permits a purchase order to reach `SENT` with a null planned
  warehouse.
- The reference direct-receive command chooses its warehouse at posting time and
  does not compare it with `plannedWarehouseId`.

As a result, ordinary purchase orders cannot enter the warehouse-scoped receiving
queue or a future receiving-draft workflow. Creating a `ReceivingDraft` against a
purchase order without persisted warehouse ownership would recreate the data-scope
failure that ADR-0020 rejected.

This ADR defines the planning baseline for authoring planned receiving warehouse
ownership before any Gate 7B mutation implementation is considered. It does not
approve code, Prisma changes, migrations, permissions, routes, feature flags, or
production enablement.

## Context

Current verified persistence behavior:

- `PurchaseOrder.plannedWarehouseId` is nullable.
- The database enforces
  `PurchaseOrder(organizationId, plannedWarehouseId) -> Warehouse(organizationId, id)`.
- The foreign key uses `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
- `(organizationId, plannedWarehouseId, status)` is indexed.
- Existing and historical purchase orders may retain null planned warehouse values.

Current reference-runtime limitations:

- `createPurchaseOrderSchema` and `PurchaseOrderService.create()` do not accept or
  persist `plannedWarehouseId`.
- `PurchaseOrderService.updateStatus()` does not require a planned warehouse before
  moving from `DRAFT` to `PENDING_APPROVAL` or ultimately to `SENT`.
- `PurchaseOrderService.receive()` remains a direct-posting reference path. It must
  not be changed by this planning ADR and is not an approved Gate 7B posting path.
- The target finite permission allowlist has no purchase-order authoring permission,
  and the legacy RBAC model is not authoritative for new target-authorized routes.
- ADR-0025 selects `IdempotencyCommand` as the planned command-replay mechanism but
  does not approve its exact schema or implementation.

The planned warehouse is commercial-to-operational handoff data. It identifies the
single warehouse authorized to receive an early-pilot purchase order; it does not
create a receipt, allocate stock, create a warehouse task, or grant a warehouse
operator purchase-order authoring authority.

## Decision Drivers

- Prevent cross-tenant and cross-warehouse receiving data exposure.
- Make purchase orders eligible for the warehouse-scoped queue only after an
  explicit, durable destination decision.
- Preserve approval integrity when a material operational destination changes.
- Retain nullable-schema compatibility for historical purchase orders.
- Avoid treating the legacy direct-receive endpoint as target receiving behavior.
- Keep multi-warehouse receiving and inbound planning out of the initial WMS scope.

## Alternatives

### Alternative 1: Select a warehouse only when posting a receipt

Pros:

- No purchase-order authoring contract is needed.
- Matches the current reference direct-receive path.

Cons:

- A purchase order has no warehouse-scoped ownership before posting.
- Warehouse queues and drafts cannot enforce a persisted destination predicate.
- A receipt actor can choose a destination after commercial approval without a
  pre-receipt audit trail.

Decision:

- Rejected. This is the ownership model ADR-0020 explicitly rejected.

### Alternative 2: Allow a generic partial update at any purchase-order state

Pros:

- Smallest apparent API surface.
- Purchasing users can correct a destination without a specific command.

Cons:

- A generic update obscures a material operational handoff.
- It can change destination after approval, sending, or partial receipt unless every
  caller independently implements lifecycle checks.
- It has no clear audit, idempotency, or re-approval semantics.

Decision:

- Rejected.

### Alternative 3: Require planned warehouse at purchase-order creation

Pros:

- Every new purchase order has a destination from its first persisted state.
- No later authoring command is needed for the normal case.

Cons:

- Purchasing may create a commercial draft before its destination is known.
- It conflicts with the nullable rollout and historical-data policy in ADR-0021.
- It does not define how an approved purchase order is safely amended.

Decision:

- Rejected as the sole workflow. Creation may accept a planned warehouse, but a
  destination is required at the commercial submission boundary rather than at
  initial draft creation.

### Alternative 4: Use a named destination command with a submission guard

Pros:

- Preserves a flexible commercial `DRAFT` while requiring a warehouse before review
  and receiving eligibility.
- Makes destination selection, amendment, audit, idempotency, and concurrency
  explicit.
- Invalidates an existing approval when a material destination change is necessary.
- Keeps historical null rows readable without inferring destination from receipts.

Cons:

- Requires a target purchasing-permission decision, command-idempotency support,
  lifecycle validation, audit coverage, and integration tests.
- Existing null-destination purchase orders in approval states require explicit
  remediation before they can enter the new workflow.

Decision:

- Selected planning direction.

### Alternative 5: Introduce a receiving-plan aggregate now

Pros:

- Supports multi-warehouse purchase orders, ASNs, appointments, cross-dock, and
  inbound consolidation.

Cons:

- Adds a large new aggregate before the initial single-warehouse receiving workflow
  is proven.
- Delays the smallest correct warehouse-scoped inbound path.

Decision:

- Deferred. It requires a separate product and schema ADR.

## Decision

The planned receiving warehouse is authored through a named purchase-order command,
with explicit lifecycle, concurrency, audit, and idempotency rules. This is a
planning decision only.

### Lifecycle Ownership

| Purchase-order state | Planned warehouse rule |
| --- | --- |
| `DRAFT` | An authorized purchasing actor may set or change the destination. A null value is allowed while the commercial draft is incomplete. |
| `PENDING_APPROVAL` | Direct changes are not allowed. An authorized amendment command may set or change the destination only by returning the purchase order to `DRAFT` and invalidating the pending approval. |
| `APPROVED` | Direct changes are not allowed. An authorized amendment command may set or change the destination only by returning the purchase order to `DRAFT` and invalidating the approval. |
| `SENT` | Immutable. A new purchase order or a future approved cancellation/reissue workflow is required. |
| `PARTIALLY_RECEIVED` | Immutable. Posted receipt history owns the physical destination evidence. |
| `RECEIVED` | Immutable. |
| `CANCELLED` | Immutable for the initial scope. |

The `DRAFT -> PENDING_APPROVAL` transition must fail if `plannedWarehouseId` is
null. Requiring the destination before submission, rather than only before `SENT`,
prevents a purchase order from being approved with an unknown warehouse and later
requiring an unreviewed material change.

This strengthens the timing recommendation in ADR-0021. The nullable database
column remains necessary for historical compatibility and incomplete commercial
drafts; it must not be interpreted as permission to submit a destination-less
purchase order.

### Candidate API Contract

The target API command is:

`POST /api/v1/purchase-orders/:id/planned-warehouse`

Candidate request body:

```json
{
  "warehouseId": "uuid",
  "expectedPlannedWarehouseId": "uuid or null",
  "amendmentReason": "Required outside DRAFT; maximum 500 characters"
}
```

Rules:

- `warehouseId` and a present `expectedPlannedWarehouseId` field are required.
- `expectedPlannedWarehouseId` may be null. It is a compare-and-set precondition,
  not a tenant selector.
- The command sets a destination; it does not clear one. Cancelling a commercial
  draft is the initial-scope alternative to removing a destination.
- In `DRAFT`, `amendmentReason` is optional.
- In `PENDING_APPROVAL` or `APPROVED`, `amendmentReason` is required, the command
  changes status to `DRAFT`, and the purchase order must be submitted and approved
  again before it can be sent.
- All body, parameter, and header schemas must be strict. UUIDs, field lengths, and
  unknown fields must be rejected.
- The response must be an allowlisted DTO containing only purchase-order ID,
  number, status, planned-warehouse ID/code/name, and updated timestamp. It must
  not serialize raw ORM objects, audit records, authorization context, or command
  metadata.

Purchase-order creation may accept an optional `plannedWarehouseId` using the same
organization and active-warehouse validation. A creation request without one is
valid only while the purchase order stays in `DRAFT`.

The current reference endpoints are not changed or implicitly approved by this
candidate contract.

### Authorization And Tenant Scope

Future implementation must establish, before any purchase-order or warehouse read:

1. Authentication and active session validation.
2. Active organization membership for the actor.
3. Target authorization for a finite, target purchasing-authoring permission.
4. Target organization scope using the actor organization as authority.
5. Selected warehouse existence and `isActive=true` inside that organization.
6. A tenant-scoped purchase-order read and lifecycle check.

Selecting a planned warehouse is a purchasing authority, not a warehouse-floor
operation. Warehouse assignment alone must not grant it. The final target
purchasing permission name and role matrix are implementation blockers because the
present finite target allowlist does not define them. This command is
organization-scoped and does not require an organization-wide warehouse-scope grant;
the selected warehouse remains subject to active same-organization validation. A
future implementation must not use legacy wildcards or infer authority from `OWNER`
or `ADMIN` alone.

Cross-tenant, missing, or inactive warehouses must return `404 NOT_FOUND` without
disclosing tenant data. An in-tenant actor lacking the required purchasing
permission must receive `403 FORBIDDEN`.

### Concurrency And Idempotency

The command must run in one serializable database transaction. It must lock or
otherwise conditionally update the purchase order, then compare the stored
`plannedWarehouseId` with `expectedPlannedWarehouseId` before changing state.

- A precondition mismatch returns `409 CONFLICT` without a state change.
- A purchase-order state mismatch returns `409 INVALID_STATE_TRANSITION` without a
  state change.
- A concurrent send, cancellation, direct receipt, or other state change must be
  re-read under the same transaction and cannot be bypassed by a stale command.
- `Idempotency-Key` is required for this command.
- The command must use the future shared `IdempotencyCommand` mechanism from
  ADR-0025 after its exact schema and replay rules are separately approved. It must
  not repurpose `GoodsReceipt.idempotencyKey`, audit rows, or an in-memory cache.
- The canonical request hash must include command name, actor organization, target
  purchase order, target warehouse, expected warehouse, and amendment reason. It
  must exclude tokens, cookies, request IDs, IP addresses, user agents, and the
  idempotency key itself.

### Audit And Observability

Each successful command must create transactional, append-only audit evidence in
the same transaction as the destination and any status change:

- `purchase_order.planned_warehouse.set` for a null-to-value assignment.
- `purchase_order.planned_warehouse.changed` for a value-to-different-value change.
- `purchase_order.planned_warehouse.amended` when an approved or pending purchase
  order is returned to `DRAFT` for re-approval.

The allowlisted audit payload must contain purchase-order ID, previous and next
warehouse IDs, previous and next purchase-order statuses, actor identity and
organization, idempotency command ID, request ID, and amendment reason where
required. It must never contain credentials, cookies, authorization headers, raw
request bodies, or raw ORM payloads.

Denied authorization diagnostics may use a safe, best-effort authorization audit,
but it does not replace the transactional mutation audit.

### Receiving Boundary

This decision makes a purchase order eligible for future warehouse-scoped inbound
work only when all of these conditions are true:

- `plannedWarehouseId` is populated.
- The planned warehouse is active.
- The purchase order is `SENT` or `PARTIALLY_RECEIVED`.
- At least one purchase-order item has `quantity > receivedQty`.

It does not authorize creation of a `ReceivingDraft`. Future draft creation must
also verify the persisted destination against the requested warehouse. A future
receipt-posting ADR must require the posting warehouse to equal
`plannedWarehouseId`; the legacy direct-receive path does not currently provide
that guarantee and must not be cited as Gate 7B or target-posting evidence.

## Migration And Rollout Direction

The planned warehouse column and tenant-safe relation already exist through
ADR-0022. The authoring contract must not backfill it by inferring a warehouse from
historical goods receipts.

- Existing purchase orders with null destination remain readable.
- Existing `SENT`, `PARTIALLY_RECEIVED`, and `RECEIVED` rows with null destination
  remain outside the receiving queue and receiving-draft workflow.
- Existing `DRAFT`, `PENDING_APPROVAL`, or `APPROVED` rows may be remediated only
  through the named command and, where applicable, a return to `DRAFT` followed by
  normal re-approval.
- Any new persistence needed for target purchasing authority, command idempotency,
  or optimistic concurrency requires a new forward-only migration. No applied
  migration may be edited.
- Feature-flag, production rollout, backup/restore, and forward-recovery details
  require a separate implementation ADR. Production remains NO-GO.

## Required Verification Before Implementation Approval

- Strict create and named-command request validation, including unknown-field,
  UUID, nullable-precondition, and bounded-reason failures.
- Same-organization active warehouse can be selected; cross-tenant, missing, and
  inactive warehouse cannot.
- Only approved target purchasing authority can select or amend a destination;
  warehouse assignment does not grant this authority by itself.
- `DRAFT` creation may omit destination, but submission fails without it.
- `DRAFT` destination assignment and change succeed only with the expected current
  destination.
- Pending or approved amendment requires a reason, returns the purchase order to
  `DRAFT`, and records re-approval-required audit evidence.
- `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`, and `CANCELLED` assignments are denied.
- Purchase orders with receipt history cannot have destination changed.
- Same idempotency key and semantic payload replay the original result; a different
  semantic payload returns `409 IDEMPOTENCY_KEY_REUSED`.
- Concurrent stale writes, submission, cancellation, and direct-receive races do
  not overwrite the selected destination or permit an invalid transition.
- Audit evidence commits with a successful command and rolls back with a failed
  command; append-only audit protections remain effective.
- No receiving draft, goods receipt, goods-receipt line, stock movement, stock
  level, purchase-order received quantity, putaway task, or inventory ledger effect
  is created by authoring the planned warehouse.
- Empty and existing-data disposable PostgreSQL migration tests pass for any new
  supporting persistence.

## Consequences

- The verified planned-warehouse column gains a defined authoring path before it is
  used as a prerequisite for receiving drafts.
- Commercial approval is protected from silent destination changes; an approved
  purchase order returns to `DRAFT` before a changed destination can proceed.
- Historical null-destination purchase orders remain compatible but are deliberately
  excluded from the new warehouse-scoped inbound workflow.
- Gate 7B remains blocked until the target purchasing authorization model in
  ADR-0027, exact shared idempotency design, implementation scope, migration plan,
  tests, security review, and production-impact review are separately approved.
- Receipt posting, stock effects, ledger effects, and production enablement remain
  outside this ADR and remain NO-GO.
