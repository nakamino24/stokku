# ADR-0019: Receiving Workflow Boundary

**Status:** Proposed for Gate 7 planning review; implementation not approved  
**Date:** 2026-09-18  
**Owners:** CTO, Principal Engineering, Backend, Security, Product  
**Related:** ADR-0003 Tenant and Warehouse Authorization, ADR-0005 Inventory Ledger and Projection, ADR-0016 Target Architecture Transition, ADR-0018 Internal Warehouse Inventory Visibility

## Problem

Inbound receiving is a P0 WMS workflow. The reference implementation can post a goods receipt and inventory effect, but it does not model the operator/supervisor draft workflow that the target product needs before a public pilot.

Gate 7 is approved for planning/specification only. No route, schema, migration, purchase-order service change, receiving mutation, inventory posting behavior, or production configuration change is approved by this ADR.

## Context

The current reference schema and service behavior are not compatible with a draft receiving workflow:

- `GoodsReceiptStatus` currently contains only `POSTED` and `REVERSED`.
- `GoodsReceipt` is created as a posted receipt, with `postedAt` defaulting to creation time.
- `PurchaseOrderService.receive()` creates the goods receipt, receipt lines, stock movement, purchase-order received quantities, and audit row in one transaction.
- `StockMovementType.RECEIPT` already exists and represents the ledger effect of accepted received stock.
- `PurchaseOrderStatus` has purchase-order lifecycle states such as `SENT`, `PARTIALLY_RECEIVED`, and `RECEIVED`; it does not model receiving draft review states.
- The reference `PurchaseOrder` table has no receiving warehouse field, so a purchase order is organization-scoped until a receipt selects a warehouse.

Therefore any state machine with `DRAFT`, `SUBMITTED`, `APPROVED`, `POSTING`, `POSTED`, `REJECTED`, `VOIDED`, or `FAILED` is target domain design. It must not be represented as if the current reference schema already supports it.

## Alternatives

### Alternative 1: Reuse `GoodsReceipt` for drafts

- **Pros:** Fewer target tables and less workflow surface at first.
- **Cons:** Conflicts with current `GoodsReceipt` invariants, weakens immutability semantics, and makes posted receipt rows carry pre-posting states they were not designed to represent.
- **Decision:** Rejected.

### Alternative 2: Encode receiving draft state on `PurchaseOrder`

- **Pros:** Avoids a new aggregate and can reuse purchase-order status transitions.
- **Cons:** Purchase orders represent commercial intent, while receiving drafts represent operational execution in a warehouse. Mixing the two would make partial receipts, rejected quantities, supervisor approval, and retry metadata ambiguous.
- **Decision:** Rejected.

### Alternative 3: Add a distinct `ReceivingDraft` aggregate before immutable posted receipt

- **Pros:** Keeps operator workflow separate from posted inventory effects, preserves `GoodsReceipt` as immutable posted evidence, enables approval and retry metadata, and gives warehouse-scoped task ownership a clear aggregate.
- **Cons:** Requires new schema, permissions, contracts, and tests in a future implementation gate.
- **Decision:** Selected target direction, but not approved for implementation in Gate 7 planning.

## Decision

The target receiving workflow will separate these responsibilities:

- `ReceivingDraft`: mutable operator/supervisor workflow before stock effect.
- `ReceivingDraftLine`: line-level quantities, disposition, notes, and exception metadata before posting.
- `IdempotencyCommand`: organization-scoped command record with request hash, result, retry metadata, and uniqueness rules.
- `GoodsReceipt`: immutable posted receipt evidence after successful posting.
- `GoodsReceiptLine`: posted receipt line evidence with accepted and rejected quantities.
- `StockMovement`: append-only inventory ledger effect.
- `StockLevel`: repairable balance projection derived from posted inventory effects.

`GoodsReceipt` must not be forced into draft behavior. It remains the posted receipt artifact.

## Target State Machine

This state machine is target domain design only:

| State | Meaning | Stock effect |
| --- | --- | --- |
| `DRAFT` | Operator is entering counts and dispositions. | None |
| `SUBMITTED` | Operator finished input and requested review. | None |
| `APPROVED` | Authorized reviewer approved posting eligibility. | None |
| `POSTING` | Posting command is executing or reserved for retry bookkeeping. | None until transaction commits |
| `POSTED` | Immutable goods receipt and ledger effect committed exactly once. | Receipt ledger effect exists |
| `REJECTED` | Reviewer rejected the draft before posting. | None |
| `VOIDED` | Draft cancelled before posting. | None |
| `FAILED` | Posting attempt failed after bounded retry or operator-recoverable failure. | No partial effect may remain |

State invariants:

- Only `POSTED` may have a goods receipt and stock movement effect.
- `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `VOIDED`, and `FAILED` must not change `StockLevel` or create receipt `StockMovement` entries.
- `POSTED` is immutable; corrections use reversal or compensating entries.
- A failed posting must preserve enough metadata for safe retry and support review without exposing secrets.

## Gate 7A Read-Only Queue Direction

Gate 7A may be designed as a read-only internal endpoint:

`GET /api/v1/internal/inbound/receiving-queue`

Gate 7A is not approved for implementation yet.

Design constraints:

- Feature flag defaults to false.
- Production startup must fail closed when the feature flag is enabled.
- `authMiddleware` runs before validation and data reads.
- Target authorization is the server-side gate.
- `inventory.read` may be used temporarily for the read-only queue until receiving permissions are added.
- Audit event is `receiving.queue.read`.
- The endpoint does not create drafts, receipts, stock movements, stock levels, purchase-order updates, or putaway tasks.
- Existing purchase-order routes remain unchanged.

Reference schema limitation:

- Current `PurchaseOrder` rows do not contain a warehouse destination. Strict warehouse-scoped data filtering is therefore unavailable for purchase orders that have never been received.
- A no-schema Gate 7A implementation can only use the requested `warehouseId` as an authorization boundary and receiving destination selector, while purchase-order eligibility remains organization-scoped.
- If product requires persisted planned warehouse ownership for the queue, Gate 7A implementation must wait for a schema ADR and migration approval.

## Gate 7B Draft Workflow Direction

Gate 7B remains planning-only. Before implementation, a new implementation proposal must answer and receive approval for:

- Whether `ReceivingDraft` is a new aggregate in target schema. Recommended decision: yes.
- Who may create, update, submit, approve, reject, void, and post. Recommended decision: operators create/update/submit; reviewers approve/reject; authorized inventory managers or explicit receiving posters post.
- Whether `POSTING` is persisted or transient. Recommended decision: transient for synchronous posting unless `FAILED` retry metadata needs a durable posting attempt record.
- How `FAILED` stores retry metadata. Recommended decision: store command id, attempt count, last safe error code, and retryable flag in `IdempotencyCommand` or a posting attempt child table, never in audit-only text.
- Whether approval is required for all organizations. Recommended decision: approval required by default; later organization policy may allow lower-friction flows, but not in the first mutation gate.
- New draft permissions: `receiving.draft.create`, `receiving.draft.update`,
  `receiving.draft.submit`, `receiving.draft.approve`, `receiving.draft.reject`,
  and `receiving.draft.void`. `receiving.receipt.post` is reserved for the separate
  future ledger/posting gate and must not be added to runtime permissions as part of
  Gate 7B. ADR-0027 defines the finite target inbound permission and scope policy.
- Idempotency storage and uniqueness. Recommended decision: unique `(organizationId, commandName, idempotencyKey)`.
- Payload hash behavior. Recommended decision: same key and same request returns original result; same key and different request returns conflict.
- Partial receipt semantics.
- Difference between `receivedQty`, `acceptedQty`, and `rejectedQty`.
- Over-receipt policy.
- Concurrency lock strategy.
- Transaction boundary between receipt, ledger, stock projection, audit, and idempotency result.
- Reversal and compensating-entry strategy.
- Retry and deadlock handling.
- Audit event transactionality.

## Quantity Semantics

Target semantics:

- `receivedQty`: physical quantity counted from supplier delivery.
- `acceptedQty`: quantity accepted into stock and eligible to increase on-hand.
- `rejectedQty`: quantity rejected, damaged, short, or otherwise not entering available stock.
- `acceptedQty + rejectedQty = receivedQty` unless a documented inspection policy introduces a separate pending-inspection quantity.
- Purchase-order received progress is derived from `acceptedQty` by default. Rejected quantity may support supplier claims but does not satisfy ordered quantity unless a future policy explicitly says otherwise.

Over-receipt policy:

- Default is deny over-receipt.
- Any tolerance or supervisor override requires explicit organization policy, audit evidence, and integration tests.

## Authorization And Audit

All receiving reads and commands must enforce:

1. Authentication.
2. Request validation.
3. Actor membership authority.
4. Warehouse existence within actor organization.
5. Target authorization decision.
6. Audit event.
7. Read or command execution.

Audit policy:

- Read audit may be fire-and-forget for internal read-only endpoints.
- Mutation audit must be transactional with the command result.
- Logs and audit payloads must not include tokens, cookies, passwords, authorization headers, raw ORM payloads, or full request bodies.
- Deny audit uses actor `userId` and actor `organizationId`.

## Ledger Posting Rules

Receiving ledger posting is a separate future gate.

When it is later approved, the posting transaction must create or update these records atomically:

- Idempotency command result.
- Posted `GoodsReceipt` and `GoodsReceiptLine` records.
- Receipt `StockMovement` entries for accepted quantities.
- `StockLevel` projection changes.
- Purchase-order received progress and derived status.
- Transactional audit event.

No partial write may survive a failed posting transaction.

## Consequences

- Gate 7 planning can proceed without schema or route changes.
- Gate 7A implementation must be explicitly approved before any read-only queue route is created.
- Gate 7B implementation and all ledger posting remain separate future approvals.
- Existing `PurchaseOrderService.receive()` remains reference behavior and is not modified by this ADR.
- Production remains NO-GO until OIDC/federation review, valid production login smoke, production configuration verification, and receiving correctness blockers are closed.
