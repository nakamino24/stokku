# ADR-0024: Receiving Draft Workflow

## Status

Approved for Gate 7B planning baseline; implementation not approved

## Date

2026-09-19

## Owners

Product, CTO, Principal Engineering, Backend, Security, Database Architecture, QA

## Related ADRs

- ADR-0003: Tenant and Warehouse Authorization
- ADR-0005: Inventory Ledger and Projection
- ADR-0019: Receiving Workflow Boundary
- ADR-0020: Purchase Order Receiving Warehouse Ownership
- ADR-0021: Purchase Order Planned Warehouse Schema and Migration
- ADR-0022: Planned Warehouse Schema Implementation and Migration
- ADR-0023: Warehouse-Scoped Receiving Queue
- ADR-0025: Receiving Draft Schema And Idempotency Design

## Problem

Gate 7A completed a read-only internal receiving queue. Stokku still needs a target workflow for warehouse operators to count inbound goods, capture exceptions, submit work for review, receive approval, and eventually post immutable receipt evidence.

The current reference flow posts receipts directly through `PurchaseOrderService.receive()`. That design is not suitable for the target product because it combines pre-posting operational work, receipt evidence, stock movement creation, stock-level projection updates, and purchase-order receipt progress in one mutation.

Gate 7B must define the receiving draft workflow boundary before any mutation work is implemented.

## Context

Current locked status:

- ADR-0022 is implemented and verified.
- ADR-0023 is implemented and verified.
- Gate 7A is complete for internal read-only scope.
- Gate 7B is not approved.
- Ledger posting is a separate future gate.
- Production enablement is not approved.
- Production readiness remains NO-GO.

Reference limitations:

- Gate 7B planning does not make the current reference schema compatible.
- `GoodsReceiptStatus` remains `POSTED` and `REVERSED` in the current reference schema.
- Existing `PurchaseOrderService.receive()` remains unchanged.
- Ledger posting is a separate future gate.
- No draft state may create stock or ledger effects.

Target aggregate boundaries:

- `PurchaseOrder`: commercial intent.
- `ReceivingDraft`: mutable pre-posting operational workflow.
- `ReceivingDraftLine`: counted, accepted, rejected quantities and exceptions.
- `GoodsReceipt`: immutable posted receipt evidence.
- `GoodsReceiptLine`: posted receipt evidence.
- `StockMovement`: append-only ledger effect.
- `StockLevel`: balance projection.
- `IdempotencyCommand`: command replay and conflict protection.

## Alternatives

### Alternative 1: Reuse `GoodsReceipt` As Draft

Benefits:

- Fewer tables initially.
- Some line structure appears reusable.

Costs:

- Overloads immutable posted receipt evidence with mutable draft workflow.
- Requires changing `GoodsReceiptStatus` semantics beyond `POSTED` and `REVERSED`.
- Makes reversal and correction semantics ambiguous.

Security impact:

- Harder to separate draft permissions from posting permissions.
- Higher risk that draft actors can affect posted evidence.

Data integrity impact:

- Weakens the invariant that goods receipts are immutable evidence.
- Increases risk of partial or accidental inventory effects from draft state.

Rollback impact:

- Difficult to unwind because draft and posted evidence share the same aggregate.

Decision:

- Rejected.

### Alternative 2: Store Receiving State On `PurchaseOrder`

Benefits:

- Minimal apparent schema expansion.
- Purchase-order screens can show receiving progress without joins to a new aggregate.

Costs:

- Mixes commercial intent with warehouse execution workflow.
- Poor fit for counted, accepted, rejected, and exception quantities.
- Poor fit for review and approval state.

Security impact:

- Purchase-order mutation permissions become entangled with receiving workflow permissions.

Data integrity impact:

- Purchase-order fields may be mistaken for receipt evidence.
- Concurrent receiving attempts are difficult to coordinate.

Rollback impact:

- Hard to disable receiving workflow after purchase-order rows contain draft state.

Decision:

- Rejected.

### Alternative 3: Create A Separate `ReceivingDraft` Aggregate

Benefits:

- Separates mutable pre-posting workflow from commercial intent and posted evidence.
- Supports operator, reviewer, and posting actor boundaries.
- Enables state-machine, idempotency, concurrency, retry, and audit controls per command.
- Compatible with future receiving plans, ASNs, supplier appointments, bins, and exception workflows.

Costs:

- Requires future schema, migration, service, route, validation, and test work.
- Requires explicit idempotency and transition design before implementation.

Security impact:

- Enables specific permissions for draft create, update, submit, approve, reject, void, and post.
- Keeps warehouse scope checks explicit.

Data integrity impact:

- Preserves `GoodsReceipt` as immutable posted evidence.
- Prevents draft states from creating inventory effects.

Rollback impact:

- Feature can be disabled before posting because drafts have no stock or ledger effects.
- Draft data remediation is isolated from receipt and ledger history.

Decision:

- Recommended planning direction.

### Alternative 4: Use An External Workflow Engine

Benefits:

- Durable orchestration, retries, timers, and workflow visibility can be strong.
- May become useful for complex inbound operations later.

Costs:

- Adds runtime, deployment, observability, and secret-management complexity.
- Requires careful consistency design between workflow state and database state.

Security impact:

- Introduces additional service-to-service authorization boundaries.

Data integrity impact:

- Requires explicit coordination between external workflow history and database transactions.

Rollback impact:

- Requires workflow cancellation and external cleanup.

Decision:

- Deferred.

### Alternative 5: Post Receipt Immediately Without Draft Or Approval

Benefits:

- Fastest path to stock changes.
- Similar to current reference behavior.

Costs:

- Does not support operator/reviewer workflow.
- Does not support pre-posting exception handling.
- Grants inventory-effect authority too early.

Security impact:

- Posting permission becomes the first mutation permission, which is too broad for operators.

Data integrity impact:

- Mistakes immediately affect receipt evidence, stock movements, and balances.

Rollback impact:

- Requires reversals or compensating entries instead of draft correction.

Decision:

- Rejected for Gate 7B.

## Decision

Gate 7B planning adopts a separate `ReceivingDraft` aggregate with `ReceivingDraftLine` children and command-level `IdempotencyCommand` protection.

Planning decisions:

- Approval is mandatory for the first mutation gate.
- Operators can create, update, and submit drafts.
- Reviewers can approve and reject drafts.
- Authorized posting actors can post approved drafts only after a separate ledger/posting gate is approved.
- The actor who creates, updates, or submits drafts must not hold approval or
  rejection authority. ADR-0027 defines this separation-of-duties policy; a future
  ADR is required to relax it.
- Warehouse scope must be checked through target authorization.
- Actor organization from authentication is the tenant authority.
- Cross-tenant warehouses must not leak.
- Unassigned warehouses must be denied.
- Inactive users and inactive memberships must fail closed.
- Revoked and expired sessions must fail closed.

Planned permissions only:

- `receiving.draft.create`
- `receiving.draft.update`
- `receiving.draft.submit`
- `receiving.draft.approve`
- `receiving.draft.reject`
- `receiving.draft.void`

These permissions must not be added to runtime allowlists until a future implementation approval explicitly authorizes them.

`receiving.receipt.post` remains reserved for the separate ledger/posting gate and
must not be added to runtime permissions or roles as part of Gate 7B draft work.

### State Machine

| State | Meaning | Allowed actor | Allowed transitions | Stock effect | Receipt effect | Audit event | Retry behavior | Persistence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DRAFT` | Operator is counting or editing receiving work before review. | Operator with `receiving.draft.create` or `receiving.draft.update`. | `SUBMITTED`, `VOIDED`. | None. | None. | `receiving.draft.created`, `receiving.draft.updated`, `receiving.draft.voided`. | Idempotent create/update/void commands replay or conflict by key. | Persisted. |
| `SUBMITTED` | Draft is ready for reviewer decision. | Operator submits; reviewer acts next. | `APPROVED`, `REJECTED`, `VOIDED` if policy allows supervisor void. | None. | None. | `receiving.draft.submitted`, then approval/rejection/void audit. | Idempotent submit replay; repeated submit is conflict unless same command result. | Persisted. |
| `APPROVED` | Reviewer approved draft for future posting. | Reviewer with `receiving.draft.approve`. | `POSTING`, `VOIDED` if no posting has started. | None. | None. | `receiving.draft.approved`. | Idempotent approve replay. Posting retry belongs to posting gate. | Persisted. |
| `POSTING` | Approved draft is being converted to posted receipt and inventory effects. | Authorized posting actor with `receiving.receipt.post`. | `POSTED`, `FAILED`. | Only inside a successful future posting transaction. | Only inside a successful future posting transaction. | Future `receiving.receipt.posted` or `receiving.post.failed`. | Bounded retry and exactly-once behavior are future ledger-gate decisions. | Implementation blocker: transient for synchronous posting unless durable retry metadata requires persisted `POSTING`. |
| `POSTED` | Draft has been successfully posted to immutable receipt evidence and inventory effects. | System result of successful posting transaction. | None except future reversal or compensating workflow outside draft. | Already applied by successful future posting transaction. | Immutable posted receipt exists. | `receiving.receipt.posted`. | Replays return posted result; corrections use reversal or compensation. | Persisted immutable terminal state. |
| `REJECTED` | Reviewer rejected submitted draft. | Reviewer with `receiving.draft.reject`. | None, or future copy-to-new-draft if approved. | None. | None. | `receiving.draft.rejected`. | Idempotent reject replay. | Persisted terminal state. |
| `VOIDED` | Draft was cancelled before posting. | Operator or reviewer with `receiving.draft.void` according to state policy. | None. | None. | `receiving.draft.voided`. | Idempotent void replay. | Persisted terminal state. |
| `FAILED` | Posting failed without partial receipt, ledger, or stock effects. | System result of posting failure. | Future retry to `POSTING` if retryable; `VOIDED` only by explicit recovery policy. | None. | None. | `receiving.post.failed`. | Retry behavior must be explicitly designed before implementation. | Persisted only if posting attempts are durable; otherwise captured by idempotency/retry metadata. |

Required invariants:

- `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `VOIDED`, and `FAILED` do not modify `StockLevel` or create `StockMovement` receipt effects.
- Only a successful `POSTING` transaction may result in `POSTED`.
- `POSTED` is immutable.
- Corrections use reversal or compensating entries, not draft mutation.
- `FAILED` cannot leave partial receipt, ledger, or stock effects.
- Invalid transitions return a planned conflict error such as `INVALID_STATE_TRANSITION`.

Implementation blocker:

- Decide whether `POSTING` is transient for synchronous posting or persisted only when durable retry metadata requires it.

### Draft Data Design

Planning only. Do not modify Prisma under this ADR.

Conceptual `ReceivingDraft` fields:

- `id`
- `organizationId`
- `warehouseId`
- `purchaseOrderId` or inbound source reference
- `status`
- `createdById`
- `submittedById`
- `approvedById`
- `rejectedById`
- `voidedById`
- timestamps
- rejection or void reason
- `version` or optimistic concurrency field

Conceptual `ReceivingDraftLine` fields:

- `id`
- `receivingDraftId`
- `purchaseOrderItemId`
- `productId`
- `variantId`
- counted or received quantity
- accepted quantity
- rejected quantity
- exception reason
- destination bin if applicable
- line version or concurrency field

Conceptual `IdempotencyCommand` fields:

- `organizationId`
- `commandName`
- `idempotencyKey`
- canonical request hash
- `status`
- result reference
- attempt count
- retryable flag
- safe error code
- timestamps

Future schema ADR must document:

- Indexes.
- Uniqueness.
- Tenant-safe relations.
- Deletion behavior.
- Status constraints.
- Decimal precision.
- Audit relation.
- Migration and backfill impact.

### Idempotency

Every Gate 7B mutation must require `Idempotency-Key`.

Scope:

`organizationId + commandName + idempotencyKey`

Required behavior:

- Same key with same canonical payload returns the original result without repeating effects.
- Same key with different canonical payload returns planned `409 IDEMPOTENCY_KEY_REUSED`.
- In-flight duplicate behavior must be defined before implementation. Recommended baseline: return a conflict or wait strategy bounded by timeout, not double execution.
- Failed retryable command behavior must be defined before implementation. Recommended baseline: allow retry only when stored command state is marked retryable and payload hash matches.
- Completed command result must be replayable.
- Hashing must be canonical and exclude transport-only metadata such as headers, cookies, request IDs, network address, and bearer tokens.

Do not implement idempotency in this planning task.

### Audit And Observability

Planned audit events:

- `receiving.draft.created`
- `receiving.draft.updated`
- `receiving.draft.submitted`
- `receiving.draft.approved`
- `receiving.draft.rejected`
- `receiving.draft.voided`
- `receiving.receipt.posted`
- `receiving.post.failed`

Each event must include:

- actor
- organization
- warehouse
- draft reference
- purchase-order or inbound source reference
- previous state
- next state
- command ID
- request ID
- outcome
- safe reason where applicable

Never log:

- access tokens
- refresh tokens
- cookies
- passwords
- authorization headers
- raw request bodies
- raw ORM payloads
- supplier/product payloads unless explicitly allowlisted

Separate observability channels:

- Transactional mutation audit for state-changing commands.
- Operational structured logs for troubleshooting.
- Metrics and traces for latency, retries, conflicts, and failures.
- Retry and dead-letter visibility for posting or idempotency recovery.

### Failure And Retry

Planned behavior uses existing error envelope conventions where possible.

| Scenario | Planned behavior |
| --- | --- |
| Validation failure | `400 VALIDATION_FAILED`; no state change. |
| Missing authentication | `401 UNAUTHORIZED`; structured security logger, no fake audit actor. |
| Missing membership | Fail closed, planned `403 FORBIDDEN`. |
| Organization mismatch | `403 FORBIDDEN`; actor organization remains tenant authority. |
| Warehouse not found | `404 NOT_FOUND`; no cross-tenant leakage. |
| Inactive warehouse | `404 NOT_FOUND` or fail-closed equivalent without draft data leakage. |
| Unassigned warehouse | `403 FORBIDDEN`. |
| Invalid state transition | Planned `409 INVALID_STATE_TRANSITION`. |
| Idempotency conflict | Planned `409 IDEMPOTENCY_KEY_REUSED`. |
| Over-receipt | Planned `409 OVER_RECEIPT` or validation conflict before state change. |
| Negative quantity | `400 VALIDATION_FAILED`. |
| `accepted + rejected != received` | `400 VALIDATION_FAILED` or planned domain conflict before state change. |
| Missing purchase-order line | `404 NOT_FOUND` scoped to actor organization and purchase order. |
| Concurrency conflict | Planned `409 CONCURRENCY_RETRY_EXHAUSTED` after bounded retry. |
| Deadlock or serialization failure | Bounded retry with safe idempotency state; exhaustion returns planned conflict. |
| Bounded retry exhaustion | Planned `409 CONCURRENCY_RETRY_EXHAUSTED`. |
| Permanent posting failure | `FAILED` with safe error code only if durable posting state is approved; no partial effects. |

Planned runtime error codes must not be introduced until implementation approval.

### Ledger Boundary

Gate 7B may design the draft workflow, but it must not implement ledger posting.

A separate future ledger gate must approve:

- Receipt transaction boundary.
- `StockMovement` creation.
- `StockLevel` projection update.
- Exactly-once behavior.
- Concurrent post behavior.
- Retry behavior.
- Reversal or compensating entries.
- Transactionally consistent audit.
- Recovery after partial infrastructure failure.

## Consequences

- Gate 7B has a target workflow architecture but remains unimplemented.
- `ReceivingDraft` is the planned mutable pre-posting aggregate.
- `GoodsReceipt` remains immutable posted evidence.
- Draft states do not affect inventory balances or ledger effects.
- Posting and ledger design remain separate future approval items.
- More ADRs are required before implementation, especially schema/migration, idempotency, API contracts, and ledger transaction boundary.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- `ReceivingDraft` or `ReceivingDraftLine` tables.
- `IdempotencyCommand` table.
- Prisma schema changes.
- Migrations.
- Runtime permission allowlist changes.
- Receiving mutation endpoints.
- Draft create/update/submit/approve/reject/void implementation.
- Receipt posting behavior.
- Stock movement creation.
- Stock-level updates.
- Ledger entries.
- Seed changes.
- Feature flag changes.
- Production configuration changes.
- Any change to `PurchaseOrderService.receive()`.
- Any change to Gate 7A read-only behavior.

## Open Questions

- Is `POSTING` transient for synchronous posting, or persisted when durable retry metadata is required?
- What exact reviewer role or permission grants approval and rejection?
- Can the same user create and approve only under a future explicit policy, or is strict separation mandatory for all tenants?
- Which purchase-order states can start a receiving draft?
- How are multiple concurrent drafts for the same purchase order and warehouse prevented or coordinated?
- Are destination bins required in the first Gate 7B implementation or deferred?
- What precision and rounding rules apply to counted, accepted, and rejected quantities?
- What is the exact canonical payload hashing algorithm?
- What is the in-flight duplicate command response contract?
- What is the bounded retry policy for serialization failures?
- Which audit events must be transactionally written with draft state transitions?
- What is the migration/backfill policy for historical direct receipts?

These open questions are implementation blockers, not assumptions.

## Approval Criteria

Gate 7B implementation remains blocked until a future approval confirms:

- State machine.
- Actor and permission matrix.
- Schema design.
- Tenant-safe relations.
- Warehouse scope behavior.
- Idempotency storage.
- Payload hashing.
- Concurrency strategy.
- Audit events.
- Failure and retry semantics.
- API contracts.
- Migration and backfill.
- Ledger boundary.
- Rollback and forward recovery.
- Disposable PostgreSQL test plan.
- Security review.
- Production impact review.
