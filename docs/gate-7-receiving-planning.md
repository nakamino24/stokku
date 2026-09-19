# Gate 7: Receiving Planning

**Status:** Gate 7A implemented and verified for internal read-only use; Gate 7B planning only  
**ADR:** `adr/0019-receiving-workflow-boundary.md`; `adr/0020-purchase-order-receiving-warehouse-ownership.md`; `adr/0021-purchase-order-planned-warehouse-schema-and-migration.md`; `adr/0022-planned-warehouse-schema-implementation-and-migration.md`; `adr/0023-warehouse-scoped-receiving-queue.md`; `adr/0024-receiving-draft-workflow.md`; `adr/0025-receiving-draft-schema-and-idempotency.md`; `adr/0026-purchase-order-planned-warehouse-authoring.md`; `adr/0027-target-authorization-policy-for-inbound-commands.md`; `adr/0028-receiving-draft-persistence-implementation.md`; `adr/0029-receiving-draft-api-contract.md`; `adr/0030-receiving-draft-implementation-slice.md`; `adr/0031-inbound-permission-allowlist-and-error-alignment.md`; `adr/0032-draft-slice-security-and-production-review.md`; `adr/0033-receiving-posting-and-ledger-boundary.md`; `adr/0034-gate-7b-implementation-approval-gate.md`; `adr/0035-canonical-promotion-plan-for-drafts.md`  
**Implementation status:** Gate 7A implemented and verified; Gate 7B not approved  
**Production status:** NO-GO

## Decisions

| Area | Status |
| --- | --- |
| Gate 5.1 remediation | COMPLETE |
| Gate 6 read-only slice | COMPLETE |
| Gate 7 planning | APPROVED |
| ADR-0019 receiving workflow boundary | APPROVED FOR PLANNING BASELINE |
| ADR-0020 PO receiving warehouse ownership | APPROVED FOR PLANNING BASELINE |
| ADR-0021 PO planned warehouse schema/migration | APPROVED FOR PLANNING BASELINE |
| ADR-0022 planned warehouse implementation/migration | IMPLEMENTED AND VERIFIED |
| ADR-0023 warehouse-scoped receiving queue | IMPLEMENTED AND VERIFIED; PRODUCTION DISABLED |
| ADR-0024 receiving draft workflow | APPROVED FOR GATE 7B PLANNING BASELINE; IMPLEMENTATION NOT APPROVED |
| ADR-0025 receiving draft schema/idempotency | APPROVED FOR GATE 7B PLANNING BASELINE; IMPLEMENTATION NOT APPROVED |
| ADR-0026 planned warehouse authoring | PROPOSED FOR GATE 7B PREREQUISITE REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0027 target inbound authorization policy | PROPOSED FOR GATE 7B PREREQUISITE REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0028 receiving draft persistence proposal | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0029 receiving draft API contract proposal | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0030 receiving draft implementation slice | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0031 inbound allowlist and error alignment | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0032 slice security and production review | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0033 posting and ledger boundary | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0034 implementation approval gate | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| ADR-0035 canonical promotion plan | PROPOSED FOR REVIEW; IMPLEMENTATION NOT APPROVED |
| Gate 7A implementation | COMPLETE FOR INTERNAL READ-ONLY SCOPE |
| Schema/migration implementation | VERIFIED |
| Gate 7B implementation | NOT YET APPROVED |
| Receiving ledger posting | SEPARATE FUTURE GATE |
| Production enablement | NOT APPROVED |
| Production readiness | NO-GO |

## Non-Implementation Boundary

This gate does not approve changes to:

- `schema.prisma`
- `migrations/**`
- `purchase-orders.service.ts`
- Existing purchase-order receiving routes
- Inventory posting behavior
- Production configuration
- Render or Vercel environment variables

ADR-0022 was the required implementation proposal before the verified
`PurchaseOrder.plannedWarehouseId` schema and migration work. Any new Gate 7B
schema or migration still requires a separately approved implementation ADR.

## Reference Runtime Facts

The current reference runtime posts receipts directly:

- `GoodsReceiptStatus` has only `POSTED` and `REVERSED`.
- `GoodsReceipt` rows represent posted receipts, not drafts.
- `PurchaseOrderService.receive()` creates the goods receipt and posts accepted inventory in one transaction.
- Receipt posting uses `StockMovementType.RECEIPT` and updates `StockLevel` projection.
- `PurchaseOrderStatus` derives `PARTIALLY_RECEIVED` or `RECEIVED` after receipt posting.
- `PurchaseOrder.plannedWarehouseId` now exists as a nullable field with a
  tenant-safe composite relation, but ordinary purchase-order create and status
  transition paths do not yet author or require it.

Therefore the target receiving draft state machine is a new domain design, not a representation of current schema compatibility.

## Gate 7A Correctness Blocker

The previous purchase-order receiving warehouse ownership blocker is closed by
ADR-0022 schema/migration verification. ADR-0023 separately approved, implemented,
and verified Gate 7A for internal read-only use; production remains disabled.

Historical reason for the blocker:

- Before ADR-0022, the reference `PurchaseOrder` model had no `warehouseId` or
  planned receiving warehouse field.
- A route can authorize the actor for a requested warehouse, but the purchase-order query would still be organization-scoped.
- Showing every eligible organization purchase order to an operator assigned to one warehouse violates least privilege and the expected product behavior of a warehouse-specific receiving queue.

Approved planning direction:

- Use ADR-0020 to decide purchase-order receiving warehouse ownership.
- Recommended baseline is `PurchaseOrder.plannedWarehouseId` for initial WMS scope.
- Use ADR-0021 to lock composite tenant-safe relation, nullable rollout, lifecycle ownership, migration verification, and rollback/forward recovery before implementation.
- Use ADR-0022 to approve exact Prisma schema, migration SQL, relation names, test matrix, and recovery strategy before coding.
- Use ADR-0023 to approve the read-only receiving queue route, feature flag, route order, DTO, audit event, and test matrix before coding.
- Do not implement an organization-scoped pilot queue unless Product explicitly accepts that all eligible organization purchase orders are visible to actors with access to one warehouse. This is not recommended for production WMS.

ADR-0022 verification evidence:

- `plannedWarehouseId String?` added to `PurchaseOrder`.
- Composite FK added and verified: `PurchaseOrder(organizationId, plannedWarehouseId) -> Warehouse(organizationId, id)`.
- `ON DELETE RESTRICT` and `ON UPDATE CASCADE` verified.
- `(organizationId, plannedWarehouseId, status)` index verified.
- Empty database migration passed.
- Existing-data migration passed.
- Cross-tenant assignment rejected by the database.
- Referenced warehouse hard delete rejected.
- Warehouse deactivation through `isActive=false` succeeded.
- Historical purchase order with inactive planned warehouse remained readable.
- Null `plannedWarehouseId` remained compatible.
- Existing `PurchaseOrderService` integration flow passed.
- Full API Jest suite passed after test harness import isolation fix: 41 suites passed, 2 suites skipped due to environment guards; 204 tests passed, 10 tests skipped.

ADR-0023 implemented the Gate 7A receiving queue for internal read-only scope. Production remains disabled and Gate 7B is not approved.

Required ADR-0021 design points:

- Composite tenant-safe relation from `PurchaseOrder(organizationId, plannedWarehouseId)` to `Warehouse(organizationId, id)`.
- Lifecycle rules for setting and changing planned warehouse across `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `PARTIALLY_RECEIVED`, and `RECEIVED`.
- Nullable rollout and existing-data backfill policy.
- Active warehouse validity checks.
- Expand/contract migration strategy.
- `(organizationId, plannedWarehouseId, status)` index.
- Open line quantity predicate `quantity > receivedQty`.
- Separation from `20260916002000_reconciliation`.

Required ADR-0022 design points:

- Exact Prisma field: `plannedWarehouseId String?`.
- Exact Prisma relation: `plannedWarehouse Warehouse?` with explicit relation name.
- Warehouse inverse relation to planned purchase orders.
- Exact SQL migration with composite FK.
- FK behavior fixed to `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
- Hard delete of referenced warehouse rejected; operational removal uses `isActive=false`.
- Future queue excludes inactive planned warehouses while historical purchase orders remain readable.
- Existing-data compatibility and seed fixture impact.
- Contract impact for create, update, and status transition gates.
- Empty-database and existing-data migration verification.
- Tenant-integrity, null-read, lifecycle, and existing service compatibility tests.
- Forward recovery and rollback/disable strategy.

## Gate 7A: Read-Only Receiving Queue Design

Candidate endpoint:

`GET /api/v1/internal/inbound/receiving-queue`

Purpose:

- Show purchase orders eligible for receiving work.
- Prove target authorization can gate inbound operational reads.
- Avoid all draft, receipt, ledger, and stock mutation.

Scope:

- Organization-scoped by actor organization.
- Warehouse-scoped by `plannedWarehouseId = authorizedWarehouseId`.
- Warehouse authorization required for the requested receiving warehouse.
- Target authorization is the server-side gate.
- `inventory.read` may be used temporarily until receiving read permissions exist.
- Audit event: `receiving.queue.read`.
- Feature flag defaults false.
- Production guard remains fail-closed.
- Feature flag is `ENABLE_INTERNAL_RECEIVING_QUEUE=false` by default.
- Production startup fails closed if `ENABLE_INTERNAL_RECEIVING_QUEUE=true`.

Reference limitation and blocker:

- Current purchase orders are not warehouse-owned before receipt.
- If Gate 7A is implemented before a schema change, `warehouseId` can prove that the actor may receive into that warehouse, but it cannot filter purchase orders by persisted destination warehouse.
- This is a correctness blocker, not a minor technical limitation.
- To satisfy strict data-level warehouse scoping, implementation must wait for a target field or aggregate that records planned receiving warehouse.

Eligible purchase-order rule for a no-mutation read-only queue:

- `organizationId` equals actor organization.
- `plannedWarehouseId` equals the authorized warehouse through the verified
  ADR-0022 schema/migration.
- `status` is `SENT` or `PARTIALLY_RECEIVED`.
- At least one line has `quantity > receivedQty`.
- Planned warehouse is active.
- Supplier and product DTO fields are allowlisted.
- Quantities are serialized as decimal strings.
- Dates are serialized as ISO-8601 strings.

Route order for any future implementation:

1. `authMiddleware`
2. Query validation
3. Actor membership authority
4. Warehouse existence inside actor organization
5. Target authorization decision
6. `receiving.queue.read` audit
7. Tenant-scoped eligible-PO read

Acceptance criteria for future Gate 7A implementation:

- Assigned warehouse can read the queue.
- Unassigned warehouse is rejected.
- Cross-tenant warehouse does not leak.
- Organization selector cannot bypass membership.
- Inactive user or membership is rejected.
- Revoked or expired session is rejected.
- Only eligible purchase orders appear.
- Query is tenant-scoped and, where data model permits, warehouse-scoped.
- Query is warehouse-scoped through persisted purchase-order receiving warehouse ownership before implementation is considered correct.
- DTO is allowlisted.
- Decimal and date serialization are explicit.
- Read audit does not contain secrets.
- Existing purchase-order routes do not change.
- Flag off returns `404 NOT_FOUND`.
- Disposable PostgreSQL integration tests exist.

Out of scope for Gate 7A:

- Creating receiving drafts.
- Creating goods receipts.
- Updating purchase orders.
- Creating stock movements.
- Updating stock levels.
- Posting ledger effects.
- Changing production config.

## Gate 7A Implementation Status

ADR-0023 is implemented and verified for internal read-only scope.

The implementation remains limited to one read-only endpoint: `GET /api/v1/internal/inbound/receiving-queue`. It does not create drafts, receipts, stock movements, stock-level changes, idempotency commands, or ledger effects.

Verification evidence:

- Focused Gate 7A suite passed: 3 suites, 16 tests.
- Full API Jest suite passed: 44 suites passed, 2 skipped due to environment guards; 220 tests passed, 10 skipped.
- Disposable PostgreSQL tests verified warehouse-scoped data predicates and no mutation of stock, receipts, ledger, or purchase orders.
- Feature flag rollback returns `404 NOT_FOUND`.
- Production startup rejects the feature flag.

## Planned Warehouse Authoring Prerequisite

The verified `plannedWarehouseId` schema has no approved authoring contract in the
reference runtime. Purchase-order creation cannot set it, and purchase-order status
transitions do not require it before a purchase order reaches `SENT`. Consequently,
ordinary purchase orders cannot enter a warehouse-scoped inbound workflow despite
the Gate 7A queue predicate being implemented.

ADR-0026 proposes the required planning baseline:

- A named planned-warehouse command rather than a generic purchase-order patch.
- Optional destination only while a commercial purchase order remains `DRAFT`.
- Required destination before transition to `PENDING_APPROVAL`.
- Destination amendment outside `DRAFT` invalidates pending or completed approval
  by returning the purchase order to `DRAFT` with an audit reason.
- Destination immutability after `SENT` or any receipt history.
- Target purchasing authority, idempotency replay, tenant checks, active-warehouse
  checks, transactional audit, and concurrency preconditions before implementation.

This prerequisite does not change the current purchase-order routes or direct
receipt path. It requires separate approval before implementation and does not
authorize receiving drafts.

## Target Authorization Prerequisite

The target authorization boundary cannot yet safely authorize inbound mutations:

- `OrganizationMember` has no independent active/inactive lifecycle.
- Legacy role permissions can contain arbitrary strings and wildcard grants.
- Legacy `OWNER` and `ADMIN` behavior implies warehouse-wide access.
- Legacy warehouse-assignment backfill assigned every existing membership to every
  warehouse and is not evidence of deliberate receiving scope.

ADR-0027 proposes the required target policy baseline:

- Active membership is the only tenant authority; user, JWT, header, query, and
  body organization values are selectors, never proof of access.
- Planned-warehouse authoring is organization-scoped purchasing authority, while
  every receiving-draft command requires an exact active warehouse assignment.
- Finite inbound permission catalog, system-role defaults, custom-role constraints,
  and creator/reviewer separation-of-duties rules are explicit.
- `OWNER` and `ADMIN` do not implicitly bypass warehouse scope on target routes.
- Wildcard, unknown, malformed, and legacy-backfilled grants cannot authorize Gate
  7B until a target policy migration and explicit remediation are approved.
- Membership, role, permission, and scope changes require transactional audit
  evidence; mutation audit cannot depend on a best-effort authorization logger.

This prerequisite is planning only. It does not modify current reference RBAC,
target adapter behavior, memberships, roles, assignments, or runtime permissions.

## Persistence Implementation Proposal Prerequisite

ADR-0025 left the exact draft persistence design open. ADR-0028 proposes the
reviewable implementation plan without authorizing implementation:

- Separate `ReceivingDraft`, `ReceivingDraftLine`, and `IdempotencyCommand`
  tables with composite tenant-safe foreign keys.
- Supporting `PurchaseOrder` and `PurchaseOrderItem` composite uniques as FK
  targets; no existing column is altered.
- Draft warehouse equality with `PurchaseOrder.plannedWarehouseId` enforced
  declaratively; null-destination POs cannot acquire drafts.
- Draft-line parentage enforced against both the parent draft and the PO item.
- One active (`DRAFT`, `SUBMITTED`, `APPROVED`) draft per PO via a partial
  unique index.
- `DRAFT` through `VOIDED` persisted; `POSTING` transient and `POSTED` /
  `FAILED` deferred to the future posting gate.
- Quantity invariants (`accepted + rejected = counted`, non-negative, reason
  coherence) as database `CHECK`s; open-quantity ceiling and lifecycle
  transitions enforced in serializable application transactions.
- Destination bin deferred; duplicated product/variant deferred.
- Over-receipt `DENY` with no override in this slice.
- Canonical SHA-256 request hashing, unique idempotency claim, bounded
  in-flight wait, same-hash replay, and different-hash `409
  IDEMPOTENCY_KEY_REUSED` conflict.
- Optimistic `version` concurrency with `expectedVersion` and bounded
  serialization retry.
- Forward-only migration, empty plus existing-data disposable tests, no
  historical backfill, and no ledger or stock writes.

This prerequisite is proposal only. It approves no `schema.prisma`, migration,
service, route, permission, seed, feature-flag, or production change.

## API Contract Proposal Prerequisite

ADR-0029 proposes the exact internal named-command contract without authorizing
implementation:

- Internal routes under `/api/v1/internal/inbound/receiving-drafts` with
  per-command permissions and a disabled-by-default flag.
- Strict `.strict()` schemas, string-only decimals, bounded reasons, line-array
  limits, and character-allowlisted `Idempotency-Key` handling.
- Creation derives lines from open PO lines; updates modify existing lines only.
- Allowlisted draft DTO with fixed six-decimal quantities and ISO-8601 dates;
  no prices, secrets, auth context, audit, or idempotency data.
- Explicit error codes including `OVER_RECEIPT` (internal) and reuse of
  `VALIDATION_FAILED`, `CONFLICT`, `IDEMPOTENCY_KEY_REUSED`,
  `INVALID_STATE_TRANSITION`, and `CONCURRENCY_RETRY_EXHAUSTED`.
- Internal offset `{ data, pagination }` shape; canonical keyset migration
  deferred to a promotion ADR.

This prerequisite is proposal only. It approves no route, handler, schema code,
DTO code, permission, migration, seed, flag registration, or production change.

## Implementation Slice Proposal Prerequisite

ADR-0030 proposes the bounded execution plan without authorizing implementation:

- Phased entry criteria: authoring, authorization-policy storage, and
  persistence land and verify before draft routes start.
- One new flag `ENABLE_INTERNAL_RECEIVING_DRAFTS=false` with production
  fail-closed guards in both config validation sites.
- Explicit allowed file scope (three inbound draft files plus three test files,
  flag wiring, docs) and explicit non-scope (PO service, receipts, stock,
  ledger, shared middleware semantics, seeds, production config).
- Serializable transaction template with row locks, revalidation, bounded
  idempotency wait, conditional version bump, and transactional audit.
- Focused plus full-suite test gates with environment-guarded skip reporting.
- Flag-off rollback with row preservation and no migration reversal.

This prerequisite is proposal only. It approves no file change, flag
registration, migration execution, permission change, or production change.

## Allowlist And Error-Alignment Proposal Prerequisite

ADR-0031 proposes the exact permission and error-code delta without authorizing
implementation:

- Eight inbound codes appended to `PERMISSIONS`; `receiving.receipt.post`
  stays reserved and ungrantable.
- Explicit role bundles where `OWNER` holds six inbound codes (no
  approve/reject), `INVENTORY_MANAGER` reviews, `WAREHOUSE_STAFF` operates,
  and no system bundle combines operator and reviewer power.
- Bearer failures stay `UNAUTHORIZED` in shared middleware; session revocation
  and expiry stay `UNAUTHENTICATED` in the target mapper; `OVER_RECEIPT` stays
  internal to the draft route layer.
- Pure `packages/domain` code change with no Prisma migration and no shared
  middleware edit.

This prerequisite is proposal only. It approves no domain edit, mapper edit,
grant, route, migration, or production change.

## Security And Production-Impact Review Proposal Prerequisite

ADR-0032 proposes the scoped slice review plan without authorizing or executing
it:

- Threat-to-control mapping for T-01 through T-15 with slice evidence per row,
  plus an OWASP Top 10 crosswalk.
- Twelve-item security checklist with finding-blocks-approval rule.
- Eight-item flag-off production-impact checklist covering guards, migration,
  performance, observability, backup and restore, rollback drill, and runbook
  references.
- Sign-off bar requiring all checklist evidence with production remaining NO-GO
  and the flag disabled in Render and Vercel production.

This prerequisite is proposal only. It approves and executes no scan,
measurement, drill, risk acceptance, code, migration, or production change.

## Posting And Ledger Boundary Proposal Prerequisite

ADR-0033 defines the future posting gate as planning without authorizing it:

- Synchronous single-transaction posting from `APPROVED` drafts with transient
  `POSTING`; no worker, no durable attempt rows in the first design.
- Eight-write atomic boundary: idempotency claim, receipt plus lines, ledger
  movements, projection, PO progress and status, draft `POSTED`, and audit.
- Deterministic receipt key, same-hash replay, concurrent-post safety, and
  bounded retry with no partial write.
- Posting warehouse equality closing the legacy bypass; creator-may-not-post;
  accepted-only stock effects with rejected quantities as evidence.
- Reversal-only correction with posted rows immutable; putaway handoff with
  null destination and `READY` tasks.

This prerequisite is planning only. It approves no schema, migration, route,
service, grant, flag, or production change.

## Canonical Promotion Proposal Prerequisite

ADR-0035 plans phased graduation from internal to canonical without
authorizing it:

- Dual-serve of canonical `/api/v1/receiving-drafts` over the same service
  with zero behavior divergence.
- Keyset `{ data, meta }` migration with opaque scope-bound cursors.
- `OVER_RECEIPT` promote-or-remap decision and single 401-code migration in
  the promotion implementation ADR.
- OpenAPI 3.1 generation, `Deprecation` and `Sunset` headers, client migration
  telemetry, and internal-path removal as separate steps.

This prerequisite is planning only. It approves no path, code, migration, or
production change.

## Gate 7B: Draft Workflow Planning

Gate 7B is not approved for implementation. It must remain planning-only until a follow-up approval explicitly authorizes schema, route, service, and test changes.

ADR-0024 defines the target receiving draft workflow planning baseline. It does not approve implementation.

ADR-0025 approves the target schema and idempotency planning baseline. It does not approve implementation.

Required design answers before implementation:

- `ReceivingDraft` must be a new aggregate rather than overloading `GoodsReceipt`.
- `ReceivingDraftLine` must hold counted, accepted, rejected, and exception quantities before posting.
- `IdempotencyCommand` must store command key, request hash, result, status, attempts, and safe error metadata.
- Operators may create/update/submit drafts.
- Reviewers may approve/reject drafts.
- Authorized inventory managers or explicit posting permission holders may post receipts.
- Voiding is allowed only before posting.
- `POSTING` is recommended as transient unless retry metadata requires durable posting attempts.
- `FAILED` must store retry-safe metadata, not partial inventory effects.
- Approval is required by default for the first mutation gate.
- `ReceivingDraft` is the planned mutable pre-posting aggregate.
- `GoodsReceipt` remains immutable posted receipt evidence.
- `IdempotencyCommand` is required before any mutation implementation but is not implemented by ADR-0024.
- Ledger posting remains a separate future gate.
- Future implementation remains blocked until exact Prisma schema, migration SQL, API contracts, idempotency hashing, concurrency strategy, permissions, tests, rollback, security review, and production impact review are approved.
- Future draft implementation also remains blocked until a planned-warehouse
  authoring contract is approved and implemented, so normal purchase orders can
  satisfy the persisted warehouse-ownership prerequisite.
- Future draft implementation also remains blocked until target inbound
  authorization policy, membership lifecycle, finite role grants, and explicit
  warehouse-scope migration are approved and implemented.
- Future draft implementation also remains blocked until the ADR-0028 persistence
  proposal is approved and its migration, authorization-policy storage, API
  contracts, feature flag, permission allowlist, tests, security review, and
  production impact review are separately approved and implemented.
- Future draft implementation also remains blocked until the ADR-0029 API contract
  proposal is approved and its route, schema, DTO, error, idempotency-header,
  pagination, flag, permission, test, security-review, and production-impact
  approvals are separately recorded and implemented.
- Future draft implementation also remains blocked until the ADR-0030 slice plan
  is approved and its entry criteria, file scope, transaction template, test
  gates, rollback procedure, security review, and production-impact review are
  satisfied.
- Future draft implementation also remains blocked until the ADR-0031 allowlist
  and error-alignment proposal is approved and its domain tests, adapter and
  contract coverage, security review, and production-impact review are recorded.
- Future draft implementation also remains blocked until the ADR-0032 security
  and production-impact review plan is approved and its checklist evidence and
  sign-off bar are satisfied.
- No ADR-0026 through ADR-0033 proposal counts as approved until the ADR-0034
  two-phase gate records per-ADR approver sign-off, evidence bundle, and status
  transition. Comments alone are not approval.

Required permissions before mutation implementation:

- `purchase_order.planned_warehouse.set`
- `receiving.draft.read`
- `receiving.draft.create`
- `receiving.draft.update`
- `receiving.draft.submit`
- `receiving.draft.approve`
- `receiving.draft.reject`
- `receiving.draft.void`

Adding these permissions changes the finite target permission allowlist and requires tests before implementation.

`receiving.receipt.post` remains reserved for the separate ledger/posting gate. It
must not be added to runtime permissions or roles as part of Gate 7B draft work.

## Idempotency Plan

Required storage behavior:

- Unique key: `(organizationId, commandName, idempotencyKey)`.
- Store a canonical request hash.
- Same key and same request returns original result.
- Same key and different request returns conflict.
- Completed command results are replayable without rerunning inventory effects.
- Failed retryable commands preserve safe error metadata and attempt count.

Candidate command names:

- `receiving.draft.create`
- `receiving.draft.update`
- `receiving.draft.submit`
- `receiving.draft.approve`
- `receiving.draft.reject`
- `receiving.draft.void`

## Ledger Posting Future Gate

Ledger posting is not part of Gate 7A or Gate 7B approval. ADR-0033 now defines
its planning boundary without authorizing implementation.

Future receiving posting must satisfy:

- One transaction creates posted receipt evidence, ledger movement, stock projection change, audit event, and idempotency result.
- No partial receipt, ledger, projection, or audit write survives transaction failure.
- Concurrent posting cannot double-increase stock.
- Deadlocks and serialization conflicts use bounded retry.
- Reversal creates compensating entries; posted rows are not silently edited.
- Posting executes synchronously from `APPROVED` drafts with transient
  `POSTING`, deterministic receipt keys, warehouse equality, creator-may-not-post,
  and reversal-only correction per ADR-0033.

## Test Plan For Future Gates

Gate 7A future implementation requires:

- Unit/API contract tests for validation, error shape, DTO allowlist, and route rollback.
- Disposable PostgreSQL integration tests for assigned warehouse read, unassigned denial, cross-tenant no-leak, inactive identity denial, revoked/expired session denial, eligible PO filtering, and audit safety.

Gate 7B future implementation requires additional tests for:

- Draft creation without stock mutation.
- Draft update without stock mutation.
- Submit, approve, reject, and void state transitions.
- Idempotency replay and payload mismatch conflict.
- Receipt posting exactly once.
- Over-receipt rejection without mutation.
- Concurrent post protection.
- Audit transactionality.

## Rollback Strategy

Gate 7A rollback:

- Disable feature flag.
- Confirm route returns `404 NOT_FOUND`.
- No data cleanup.

Gate 7B rollback before posting:

- Disable feature flag.
- Preserve draft rows for audit and operator recovery if rows exist.
- Do not delete or mutate posted inventory evidence.

Receipt posting rollback:

- Not destructive.
- Use reversal or compensating entries in a separately approved gate.

## Traceability

Gate 7 planning traces to:

- `docs/PRD.md` P0 Inbound: PO, partial receipt, inspection/quarantine, putaway task, bin confirmation.
- `docs/PRD.md` Product Principles: every mutation is a named, authorized command; posted documents are immutable; failed mutation is safe to retry.
- `docs/SRS.md` `AUTH-06`: active organization membership before tenant data access.
- `docs/SRS.md` `TEN-02`: warehouse operations verify organization membership and warehouse scope.
- ADR-0020: purchase-order receiving warehouse ownership required before a warehouse-specific receiving queue can be implemented correctly.
- `docs/SRS.md` `INV-01`: append-only ledger after posting.
- `docs/SRS.md` `INV-04`: transactional, idempotent physical mutations.
- `docs/SRS.md` `INV-05`: reversals create compensating entries.
- `docs/SRS.md` `INB-01`: purchase-order state rules.
- `docs/SRS.md` `INB-02`: partial quantities, over-receipt policy, quality disposition, rejected quantities, immutable receiving audit trail.
- `docs/SRS.md` `INB-03`: accepted receipt quantity increases stock exactly once.
- `docs/SRS.md` `REL-01`: receipt commands require rollback, idempotency, concurrency, and retry tests.

## Production Blockers

Gate 7 planning does not unblock production. Production remains blocked by:

- OIDC/federation review not verified.
- Valid production login smoke not verified.
- `ENABLE_INTERNAL_INVENTORY` must remain disabled in Render and Vercel production.
- Gate 7A receiving queue is implemented and verified for internal read-only scope,
  but must remain disabled in production without separate production enablement
  approval.
- Receiving draft workflow, receiving permissions, idempotency storage, and posting transaction design are not implemented.
- Planned-warehouse authoring for normal purchase orders is not implemented; normal
  purchase-order creation still produces null-destination purchase orders.
- Inbound mutation authorization is not implemented: target membership status,
  finite inbound role grants, assignment provenance, and legacy wildcard migration
  remain unresolved.
- Receiving draft persistence is not implemented: ADR-0028 is a proposal only and
  no draft, line, or idempotency table, constraint, or index has been created.
- Receiving draft API contract is not implemented: ADR-0029 is a proposal only
  and no draft route, schema, DTO, or handler exists.
- Draft slice security and production-impact reviews are not executed: ADR-0032
  is a proposal only and no checklist evidence or sign-off exists.
- Gate 7B has no implementation approval: ADR-0034 is a proposal only and no
  per-ADR sign-off, evidence bundle, or status transition is recorded.
- Receipt posting exactly-once behavior is not approved for production activation.
- Production runtime role separation and append-only trigger bypass controls are not verified.
