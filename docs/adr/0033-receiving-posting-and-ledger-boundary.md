# ADR-0033: Receiving Posting And Ledger Boundary Planning

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Principal Engineering, Database Architecture, Backend, Security, QA, Product

## Related ADRs

- ADR-0005: Inventory Ledger and Projection
- ADR-0015: Append-Only Ledger and Audit Controls
- ADR-0019: Receiving Workflow Boundary
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal
- ADR-0029: Receiving Draft API Contract Proposal
- ADR-0030: Receiving Draft Implementation Slice And Rollout Plan
- ADR-0031: Inbound Permission Allowlist And Error-Code Alignment
- ADR-0032: Draft Slice Security And Production-Impact Review Plan

## Problem

The draft slice (ADR-0024 through ADR-0032) deliberately stops before inventory
effects: draft states create no receipt, movement, projection, or purchase-order
progress. The product is incomplete without the posting step that converts an
`APPROVED` draft into immutable receipt evidence plus exactly-once ledger
effects — and that step is the highest-risk transaction in Gate 7 because it
touches five aggregates atomically.

The reference `PurchaseOrderService.receive()` proves the danger of leaving this
boundary undesigned: it chooses its warehouse at posting time without comparing
to `plannedWarehouseId`, derives PO status inline, and mixes receipt evidence
with projection writes in a path that predates draft review entirely. A future
posting gate must not copy that path; it must post only from an approved draft,
only to its persisted warehouse, exactly once, with no partial write surviving
failure.

This ADR defines the posting and ledger boundary as planning. It authorizes no
schema, migration, route, service, permission, or production change.

## Context

Locked inputs:

- Draft persistence proposal (ADR-0028): `DRAFT` through `VOIDED` persisted;
  `POSTING` transient; `POSTED` / `FAILED` deferred here.
- Idempotency proposal: unique `(organizationId, commandName, idempotencyKey)`,
  canonical SHA-256 hashing, same-hash replay, different-hash `409`.
- Authorization policy (ADR-0027): active membership authority, exact warehouse
  assignment, separation of duties, transactional mutation audit.
- Ledger invariants (ADR-0005, ADR-0015): append-only `StockMovement`,
  repairable `StockLevel` projection, trigger-enforced immutability, reversals
  as compensating entries.
- Reference posting mechanics
  (`apps/api/src/modules/purchase-orders/purchase-orders.service.ts:194`):
  serializable transaction, receipt-number sequencing, per-line accepted /
  rejected accounting, balance ensure plus receive, PO received-quantity
  increment, derived PO status, transactional audit. Reusable as a pattern,
  not as a path: it posts without draft review and without planned-warehouse
  equality.

## Alternatives

### Alternative 1: Post directly from the purchase order, bypassing drafts

Pros:

- Matches the reference runtime today.

Cons:

- No review, no SoD, no warehouse-equality guarantee, no idempotent draft
  lineage.
- Reintroduces the ownership failure ADR-0020 rejected.

Decision:

- Rejected.

### Alternative 2: Asynchronous posting worker with durable `POSTING` rows and retry queues

Pros:

- Survives process restarts mid-post; visible retry backlog.

Cons:

- Requires a worker runtime, job tables, claim timeouts, poison-message
  handling, and cross-process consistency design before the first posting ever
  succeeds.
- Disproportionate to a synchronous pilot posting that completes inside one
  request transaction.

Decision:

- Deferred. Revisit only with measured evidence that synchronous posting
  cannot meet pilot latency or availability needs.

### Alternative 3: Synchronous single-transaction posting from `APPROVED` drafts with transient `POSTING`

Pros:

- One request, one serializable transaction, one commit-or-rollback outcome.
- No new runtime or job infrastructure.
- Idempotency claim plus deterministic receipt key makes retry safe without
  durable attempt rows.
- `FAILED` is a replayable idempotency outcome plus draft-state metadata from
  a follow-up migration, not a half-written ledger.

Cons:

- A process crash between commit and response relies on idempotent replay by
  the caller; clients must retain their key.
- Long transactions hold row locks across five aggregates; requires bounded
  retry and pilot load measurement.

Decision:

- Selected planning direction.

## Decision

### Execution Model

- Synchronous only. `POSTING` is a transient in-memory execution phase, never
  a persisted draft status in this gate's first posting design.
- One `POST /api/v1/internal/inbound/receiving-drafts/:id/post` command (exact
  path and flag belong to a future posting implementation ADR) executes the
  entire posting transaction and returns only after commit or rollback.
- `Idempotency-Key` is required in the `receiving.receipt.post` namespace.
  The claim row, domain writes, and audit row commit together; infrastructure
  failure rolls everything back so the same key retries safely.

### Preconditions

Posting is allowed only when all hold under row locks in the same transaction:

- Draft status is `APPROVED` with `expectedVersion` match.
- Draft warehouse equals `PurchaseOrder.plannedWarehouseId`; the posting
  warehouse is the persisted draft warehouse, never a request-selected
  alternate. This closes the legacy direct-receive bypass by construction.
- Planned warehouse is active and in the actor organization.
- Purchase order is `SENT` or `PARTIALLY_RECEIVED` with at least one line
  where `quantity > receivedQty`.
- Every draft line still satisfies `accepted + rejected = counted` and each
  accepted quantity does not exceed its live open quantity.
- Posting actor holds `receiving.receipt.post` with exact warehouse assignment
  and is not the draft creator (separation of duties extends to posting).

Violation returns no partial write: state mismatch yields
`409 INVALID_STATE_TRANSITION`, stale quantities yield `409 CONFLICT`,
over-acceptance yields `409 OVER_RECEIPT`, version mismatch yields
`409 CONFLICT`.

### Transaction Boundary

One serializable transaction must create or update all of the following, or
commit none of them:

1. `IdempotencyCommand` claim and result in the `receiving.receipt.post`
   namespace.
2. `GoodsReceipt` posted evidence with a deterministic idempotency key derived
   from the post command (proposal: `POST:{draftId}:{requestHash-prefix}`),
   so a retried post cannot mint a second receipt.
3. `GoodsReceiptLine` rows snapshotted from the approved draft lines
   (expected, counted, accepted, rejected quantities with product and variant
   carried from the PO item).
4. `StockMovement` `RECEIPT` entries for accepted quantities only, with
   before/after balance snapshots, source document linkage, and per-line
   deterministic keys (`GR:{receiptId}:LINE:{receiptLineId}` precedent).
5. `StockLevel` projection increments for accepted quantities, preserving
   `available = onHand - allocated - hold`.
6. `PurchaseOrderItem.receivedQty` increments by accepted quantities and
   derived `PurchaseOrder.status` (`PARTIALLY_RECEIVED` / `RECEIVED`) plus
   `receivedDate` when fully received.
7. Draft transition `APPROVED` to `POSTED` with posted-receipt linkage and
   timestamp (requires a follow-up migration adding `POSTED` / `FAILED` to the
   status enum plus `postedReceiptId`, `postedAt`, `failedAt`, and safe
   `failureCode`; exact SQL belongs to the posting implementation ADR, not
   this planning ADR).
8. Transactional `AuditLog` event `receiving.receipt.posted` with actor,
   membership, organization, warehouse, draft, PO, receipt, command and
   request IDs, and safe quantities.

Rejected quantities never touch on-hand; they survive as receipt-line evidence
for supplier claims only.

### Exactly-Once Rules

- Same key plus same canonical hash replays the stored receipt without
  re-executing any write.
- Same key plus different hash returns `409 IDEMPOTENCY_KEY_REUSED`.
- Concurrent posts of one draft serialize on the draft row lock; the loser
  replays the winner's receipt or receives `409 INVALID_STATE_TRANSITION` if
  the draft is already `POSTED`.
- Serialization, deadlock, and unique-violation conflicts use bounded retry
  (up to 3 attempts proposed); exhaustion returns
  `409 CONCURRENCY_RETRY_EXHAUSTED` with no partial write.

### Failure And Reversal

- Business failures (state, scope, quantity, version, idempotency mismatch)
  commit a sanitized `FAILED_FINAL` idempotency result with a safe error code
  and leave the draft `APPROVED` for operator correction; no `FAILED` ledger
  residue exists.
- Infrastructure failures roll back the entire transaction including the
  claim; retry with the same key is safe.
- `FAILED` as a persisted draft state is reserved for a durable-attempt design
  only if synchronous posting proves insufficient; it is not added in the
  first posting design.
- Corrections after `POSTED` use the existing reversal path (`REVERSED`
  receipt plus compensating `REVERSAL` movements). Posted rows are never
  edited or deleted; the draft stays `POSTED` and immutable.
- Reversal authorization, putaway-task consequences, and supplier-claim flows
  belong to future gates, not this boundary.

### Permission And Role Direction

- `receiving.receipt.post` remains reserved until the posting implementation
  ADR. Proposed home: `INVENTORY_MANAGER` and `OWNER` (as inventory
  authority), never `WAREHOUSE_STAFF`, `CASHIER`, or `VIEWER`.
- Posting requires exact warehouse assignment like every draft mutation.
- Creator-may-not-post extends ADR-0027 separation of duties to the ledger
  boundary.

### Putaway Handoff

- Posting creates receipt lines with putaway task state `READY` and null
  destination, reusing the existing `GoodsReceiptLine` putaway workflow.
- Destination-bin selection and putaway completion stay in the putaway gate;
  posting must not assign bins or complete putaway tasks.

## Implementation Blockers Remaining

A future posting implementation ADR must still lock:

- Exact follow-up migration SQL (`POSTED` / `FAILED` enum values,
  `postedReceiptId`, timestamps, failure code, indexes).
- Exact post route contract, DTO, and error table.
- Deterministic receipt idempotency-key derivation.
- Feature flag and production guard for posting (separate from the draft
  flag).
- Runtime grant of `receiving.receipt.post` and its role matrix.
- Balance-ensure and unit-price sourcing rules for accepted quantities.
- Disposable migration plus concurrency and retry verification.
- Security review and production-impact review for ledger effects.

## Test Matrix Proposal

Disposable PostgreSQL tests must prove:

- Post from `APPROVED` only; all other states yield
  `INVALID_STATE_TRANSITION` without writes.
- Posting warehouse equality enforced; alternate-warehouse post denied.
- Stale PO status, inactive warehouse, and closed lines deny without writes.
- Same-key replay returns the identical receipt; different-hash key reuse
  conflicts; concurrent double-post cannot double-increase stock.
- Accepted-only projection math with `available` invariant on every balance.
- PO received-quantity and status derivation including the fully-received
  transition and `receivedDate`.
- Rejected quantities create evidence but no on-hand effect.
- Audit, idempotency result, receipt, lines, movements, projection, PO
  progress, and draft `POSTED` commit atomically; induced audit failure rolls
  back everything.
- Reversal creates compensating entries; posted rows are never mutated.
- Flag-off and production-guard behavior for the posting route.

## Consequences

- The receiving workflow gains a complete planning boundary from counting to
  ledger with no implementation authorized.
- Exactly-once posting, warehouse equality, creator-may-not-post, and
  reversal-only correction move from convention to proposal text.
- Draft, posting, reversal, putaway, canonical promotion, and production
  enablement remain separately gated.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- Any schema or migration change, including `POSTED` / `FAILED` values.
- Any route, service, permission grant, or flag change.
- Any change to `PurchaseOrderService.receive()` or Gate 7A behavior.
- Any reversal, putaway, canonical promotion, or production change.
- Production enablement.
