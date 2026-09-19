# ADR-0029: Receiving Draft API Contract Proposal

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Backend, Product, Security, QA, Principal Engineering

## Related ADRs

- ADR-0003: Tenant and Warehouse Authorization
- ADR-0007: API Versioning and Command Contract
- ADR-0019: Receiving Workflow Boundary
- ADR-0023: Warehouse-Scoped Receiving Queue
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal

## Problem

Gate 7B has a workflow baseline (ADR-0024), a schema direction (ADR-0025), an
exact persistence proposal (ADR-0028), a planned-warehouse authoring baseline
(ADR-0026), and a target authorization policy (ADR-0027). It still has no exact,
reviewable HTTP contract for the draft commands. Without that contract,
validation strictness, DTO allowlists, error codes, idempotency-header handling,
pagination shape, and route ordering cannot be reviewed for tenant safety,
least-privilege scope, retry safety, or operator clarity.

The reference runtime also has three contract gaps the proposal must close:

- The shared `validate` middleware returns `400 BAD_REQUEST` and does not enforce
  `.strict()`; unknown mutation fields are stripped, not rejected.
- `AppError.badRequest` emits `BAD_REQUEST`, while the target contract and Gate
  7A use `VALIDATION_FAILED`.
- `requireIdempotencyKey` checks only length (8–128) with no character allowlist,
  no replay, and no mismatch-conflict behavior.
- Purchase-order schemas preprocess JavaScript numbers into decimal strings,
  which admits float interpretation before validation.
- `authMiddleware` emits `UNAUTHORIZED` for bearer failures, while target
  deny-mapping uses `UNAUTHENTICATED` for revoked or expired sessions.

This ADR proposes the exact Gate 7B HTTP contract for review. It authorizes no
route, service, validation, permission, migration, seed, feature-flag, or
production change.

## Context

Locked inputs this proposal builds on:

- Draft states in this slice: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`,
  `VOIDED`. No `POSTING`, `POSTED`, or `FAILED` route exists here.
- Persistence proposal (ADR-0028): composite FKs, partial active-draft index,
  quantity and reason `CHECK`s, unique idempotency claim, optimistic `version`.
- Authorization policy (ADR-0027): active membership as sole tenant authority,
  finite inbound permissions, exact warehouse assignment for every draft action,
  organization-scoped purchasing authority, separation of duties, fail-closed
  legacy grants, transactional mutation audit.
- Gate 7A precedent (ADR-0023): internal non-canonical route, disabled-by-default
  flag, production fail-closed startup, route-local strict parsing, allowlisted
  DTO with string decimals and ISO-8601 dates, offset pagination
  `{ data, pagination }`, organization-selector-equals-actor rule, warehouse
  active check, target `authorize()` before any business read.
- Canonical API rules (ADR-0007, `docs/API.md`): `/api/v1` versioning, named
  commands, allowlisted DTOs, request-ID errors, organization-scoped
  idempotency, keyset `{ data, meta }` collections. The Gate 7B slice below
  deliberately stays internal and non-canonical until a separate promotion ADR
  migrates it to the canonical shape.

## Alternatives

### Alternative 1: Canonical public routes now

Pros:

- No second contract migration later.
- Keyset pagination and canonical error codes from day one.

Cons:

- Commits the public `/api/v1` surface before authorization-policy storage,
  persistence migration, and draft behavior are proven.
- Forces canonical promotion of permissions, error codes, and pagination while
  their prerequisites are still proposed.
- Harder to roll back without a public deprecation.

Decision:

- Rejected for the first slice.

### Alternative 2: Generic CRUD (`POST /drafts`, `PATCH /drafts/:id` with free-form body)

Pros:

- Smallest route table.
- Familiar REST shape.

Cons:

- A single patch endpoint obscures submit, approve, reject, and void as distinct
  authorized commands with distinct permissions, audits, and idempotency
  namespaces.
- Lifecycle, separation-of-duties, and replay rules must be inferred from body
  flags rather than reviewed per command.
- Violates the named-command rule in ADR-0007 and the PRD principle that every
  mutation is a named, authorized command.

Decision:

- Rejected.

### Alternative 3: Internal named-command routes with strict per-command schemas

Pros:

- Each transition has its own permission, idempotency namespace, audit event,
  validation schema, and error mapping.
- Matches the Gate 7A internal-slice precedent and ADR-0007 named-command rule.
- Can be disabled by a single feature flag and promoted to canonical later with
  an explicit migration ADR.
- Strict schemas, string-only decimals, and allowlisted DTOs are reviewable per
  command.

Cons:

- More routes and schemas to review and test.
- Internal offset pagination and internal error-code additions must still be
  migrated on canonical promotion.

Decision:

- Selected proposal direction.

## Decision

Propose internal, non-canonical, feature-flagged named-command routes with
exact paths, methods, schemas, DTOs, headers, ordering, errors, and pagination.
Proposal only.

### Route Table

Base: `/api/v1/internal/inbound/receiving-drafts`

| Method | Path | Command | Permission |
| --- | --- | --- | --- |
| `POST` | `/` | `receiving.draft.create` | `receiving.draft.create` |
| `GET` | `/` | draft queue read | `receiving.draft.read` |
| `GET` | `/:id` | draft detail read | `receiving.draft.read` |
| `PATCH` | `/:id` | `receiving.draft.update` | `receiving.draft.update` |
| `POST` | `/:id/submit` | `receiving.draft.submit` | `receiving.draft.submit` |
| `POST` | `/:id/approve` | `receiving.draft.approve` | `receiving.draft.approve` |
| `POST` | `/:id/reject` | `receiving.draft.reject` | `receiving.draft.reject` |
| `POST` | `/:id/void` | `receiving.draft.void` | `receiving.draft.void` |

No `POST /:id/post` route exists in this slice. No posting, receipt, stock, or
ledger route is proposed here.

Feature flag (name proposed, not registered by this ADR):

- `ENABLE_INTERNAL_RECEIVING_DRAFTS=false` by default.
- When false, no route in this table is mounted and all paths fall through to
  `404 NOT_FOUND`.
- Production startup must fail closed if the flag is true.
- Independent from `ENABLE_INTERNAL_RECEIVING_QUEUE` and
  `ENABLE_INTERNAL_INVENTORY`.
- Must not be enabled in Render or Vercel production.

### Request Pipeline Order

Every route in this table must execute in this order:

1. Feature-flag route registration.
2. API limiter and request-ID middleware (existing, unchanged).
3. `authMiddleware` (existing, unchanged for this proposal).
4. Route-local strict validation of params, query, body, and
   `Idempotency-Key` header where required.
5. Actor membership context via the target authorization adapter.
6. Organization-selector check where a selector is allowed (reads only).
7. Warehouse existence plus `isActive=true` check inside the actor organization.
8. Target `authorize()` with the route's exact permission and persisted draft
   warehouse (reads authorize against the requested warehouse; mutations
   authorize against the persisted draft warehouse, never a caller-selected
   alternate).
9. Tenant-scoped PO and draft load; no business read occurs before steps 1–8
   succeed.
10. Idempotent command execution, state transition, idempotency-result write,
    and transactional audit in one serializable transaction (mutations only).
11. Allowlisted DTO response with `X-Request-ID`.

Existing shared helpers must not be reused as-is where they contradict this
contract:

- Do not use `requirePermission` / `requirePermissionFromRequest` as the
  authoritative gate; target `authorize()` is authoritative.
- Do not use `assertWarehouseAccess` alone; explicit assignment plus active
  warehouse checks per ADR-0027 are required.
- Do not use shared `validate` alone; route-local strict parsing returning
  `VALIDATION_FAILED` is required.
- Do not use `requireIdempotencyKey` alone; the character allowlist and
  replay rules below are required.

### Validation Rules

All params, query, and body schemas in this table must use `.strict()`.
Unknown fields are rejected, never stripped.

Common primitives:

- `uuid`: `z.string().uuid()`.
- `decimalString`: `z.string().regex(/^\d+(?:\.\d{1,6})?$/)`. JavaScript numbers
  are rejected; callers send strings only to avoid float interpretation.
- `expectedVersion`: `z.number().int().positive()`.
- `reason500`: `z.string().trim().min(1).max(500)`.
- `deliveryRef200`: `z.string().trim().max(200)`; empty string is treated as
  absent by the service layer.
- `idempotencyKey`: `z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/)` from the
  `Idempotency-Key` header. Required on all six mutation routes, forbidden to
  be empty, and never read from query or body.
- Line arrays: `z.array(...).min(1).max(200)` with a uniqueness refinement on
  the line identifier used by that command.

Per-command schemas:

- Create `POST /` body: `{ purchaseOrderId: uuid, warehouseId: uuid,
  supplierDeliveryReference?: deliveryRef200 }`. No `organizationId`, no
  `expectedVersion`, no `lines` array. Lines are derived by the service from
  every currently open PO line with zero counts, which guarantees
  line-parentage and prevents invented products.
- List `GET /` query: `{ warehouseId: uuid, status?: draft-status enum,
  organizationId?: uuid selector, page?: int>=1, limit?: 1..100,
  sortBy?: createdAt | updatedAt | status, sortOrder?: asc | desc }`.
- Detail `GET /:id` params: `{ id: uuid }`.
- Update `PATCH /:id` params plus body: `{ expectedVersion,
  supplierDeliveryReference?: deliveryRef200 | null, lines: [{ id: uuid,
  countedQuantity: decimalString, acceptedQuantity: decimalString,
  rejectedQuantity: decimalString, exceptionReason?: reason500 | null }] }`.
  Update may modify only existing draft lines; it may not add, remove, or
  rebind lines to other PO items. `accepted + rejected = counted` is validated
  before any write; the database `CHECK` remains defense in depth.
- Submit `POST /:id/submit` body: `{ expectedVersion }`. Requires at least one
  line with `countedQuantity > 0` and revalidates PO status, warehouse active
  state, warehouse equality, and per-line open quantities.
- Approve `POST /:id/approve` body: `{ expectedVersion }`. Repeats the submit
  revalidation at approval time; creator self-approval is denied.
- Reject `POST /:id/reject` body: `{ expectedVersion, rejectionReason:
  reason500 }`.
- Void `POST /:id/void` body: `{ expectedVersion, voidReason: reason500 }`.

### Response DTOs

Single resource: `{ "data": { ... } }`. Collections:
`{ "data": [ ... ], "pagination": { page, limit, total, totalPages, hasNext, hasPrev } }`.
This matches the Gate 7A internal convention, not the canonical keyset
`{ data, meta }`. Canonical promotion must migrate pagination in a separate ADR.

Draft DTO (allowlisted):

```json
{
  "data": {
    "id": "draft-uuid",
    "status": "DRAFT",
    "version": 3,
    "warehouse": { "id": "warehouse-uuid", "code": "WH-01", "name": "Main" },
    "purchaseOrder": { "id": "po-uuid", "poNumber": "PO-0001", "status": "SENT" },
    "supplierDeliveryReference": "DN-88 or null",
    "lines": [
      {
        "id": "draft-line-uuid",
        "purchaseOrderItemId": "po-item-uuid",
        "countedQuantity": "10.000000",
        "acceptedQuantity": "8.000000",
        "rejectedQuantity": "2.000000",
        "exceptionReason": "Torn carton or null",
        "openQuantity": "12.000000",
        "product": { "name": "Widget", "sku": "W-01" },
        "variant": { "id": "var-uuid", "name": "Red", "sku": "W-01-R" }
      }
    ],
    "createdByMembershipId": "membership-uuid",
    "submittedByMembershipId": null,
    "approvedByMembershipId": null,
    "rejectedByMembershipId": null,
    "voidedByMembershipId": null,
    "createdAt": "2026-09-19T00:00:00.000Z",
    "updatedAt": "2026-09-19T00:00:00.000Z",
    "submittedAt": null,
    "approvedAt": null,
    "rejectedAt": null,
    "voidedAt": null,
    "rejectionReason": null,
    "voidReason": null
  }
}
```

Serialization rules:

- All quantities serialize as fixed six-decimal strings (`toFixed(6)`), matching
  the canonical-hash normalization in ADR-0028.
- All timestamps serialize as ISO-8601 strings; absent timestamps are `null`.
- `variant` is `null` when the PO item has no variant.
- `openQuantity` is reference information derived at read time; it never
  authorizes a write by itself.

Excluded from every response:

- Raw Prisma rows, audit rows, idempotency keys, hashes, results, session data,
  authorization context, IP addresses, user agents, secrets, raw headers,
  purchase prices, costs, supplier PII beyond the allowlisted name, and any
  cross-tenant data.

### Error Contract

Use the existing nested envelope
`{ "error": { "code", "message", "requestId", "details?" } }` with these
route-specific codes:

| Case | HTTP | Code |
| --- | --- | --- |
| Flag disabled | 404 | `NOT_FOUND` |
| Missing or invalid bearer auth | 401 | `UNAUTHENTICATED` |
| Revoked or expired session | 401 | `UNAUTHENTICATED` |
| Invalid params, query, body, or idempotency header | 400 | `VALIDATION_FAILED` |
| Organization selector mismatch | 403 | `FORBIDDEN` |
| Missing membership | 403 | `FORBIDDEN` |
| Missing receiving permission | 403 | `FORBIDDEN` |
| Creator self-approval or self-rejection | 403 | `FORBIDDEN` |
| Existing warehouse but no assignment | 403 | `FORBIDDEN` |
| Missing, cross-tenant, or inactive warehouse | 404 | `NOT_FOUND` |
| PO, draft, or line not found in actor scope | 404 | `NOT_FOUND` |
| Invalid state transition | 409 | `INVALID_STATE_TRANSITION` |
| Expected-version mismatch | 409 | `CONFLICT` |
| Live open quantity changed underneath the draft | 409 | `CONFLICT` |
| Duplicate active draft for one PO | 409 | `CONFLICT` |
| In-flight duplicate exceeds bounded wait | 409 | `CONFLICT` |
| Same key with different semantic payload | 409 | `IDEMPOTENCY_KEY_REUSED` |
| Accepted quantity exceeds open quantity | 409 | `OVER_RECEIPT` |
| Serialization retry exhausted | 409 | `CONCURRENCY_RETRY_EXHAUSTED` |

Notes:

- `UNAUTHENTICATED` is the proposed canonical 401 code for these routes. The
  shared `authMiddleware` currently emits `UNAUTHORIZED`; a future middleware
  alignment ADR must reconcile the two rather than letting each new route invent
  its own 401 code. This proposal does not change shared middleware.
- `OVER_RECEIPT` is a new internal code with allowlisted details
  `{ purchaseOrderItemId, openQuantity, acceptedQuantity }`. It is not added to
  the canonical stable-code list until a promotion ADR approves it.
- `details` never carries secrets, counts outside caller scope, or raw payloads.

### Organization Selector And Scope Rules

- Reads accept an optional `organizationId` selector that must equal the actor
  organization. It never establishes tenant authority.
- Mutations accept no `organizationId` anywhere; actor organization from
  membership context is the only tenant authority.
- Warehouse scope is always verified against the persisted draft warehouse for
  mutations, and against the requested active warehouse for reads and creation.
  Caller-selected alternates for an existing draft are rejected as validation
  failures before authorization where they appear, and denied where they imply
  scope bypass.

### Audit And Observability Hooks

- Successful mutations write their transactional `AuditLog` row in the same
  transaction as the version bump and idempotency result, using the event names
  from ADR-0024 / ADR-0026 / ADR-0027.
- Authorization allow/deny diagnostics may use the best-effort authorization
  audit helper; it never substitutes for transactional mutation audit.
- Structured logs, metrics, and traces follow the existing request-ID
  conventions and redact secrets, headers, cookies, and raw bodies.

## Implementation Blockers Remaining

This contract proposal alone does not unblock implementation. A separate
approval must still lock:

- ADR-0028 persistence migration implementation and verification.
- ADR-0027 authorization-policy storage and migration implementation.
- ADR-0026 planned-warehouse authoring implementation.
- Feature-flag registration and production fail-closed guard.
- Runtime permission allowlist update.
- Shared 401-code alignment (`UNAUTHORIZED` vs `UNAUTHENTICATED`).
- Canonical promotion plan (keyset pagination, stable codes, OpenAPI).
- Disposable contract and integration test execution.
- Security review and production impact review.

## Test Matrix Proposal

Contract tests (no database writes beyond disposable fixtures):

- Strict rejection of unknown body, query, param, and header fields per route.
- Number-typed quantities rejected; string decimals accepted up to six places.
- Missing or malformed `Idempotency-Key` rejected on every mutation route.
- `expectedVersion` missing, zero, or non-integer rejected.
- Update with added, removed, or rebound line IDs rejected.
- Submit with all-zero counts rejected.
- Reject without reason and void without reason rejected.
- Cross-tenant, missing, and inactive warehouse mapped to `404`; unassigned
  warehouse and missing permission mapped to `403`.
- Self-approval and self-rejection mapped to `403`.
- Invalid transitions mapped to `INVALID_STATE_TRANSITION`; stale versions to
  `CONFLICT`; mismatched idempotency payloads to `IDEMPOTENCY_KEY_REUSED`;
  over-acceptance to `OVER_RECEIPT`.
- DTO assertions for string decimals, ISO-8601 dates, null variant handling,
  and exclusion of prices, secrets, auth context, audit, and idempotency data.
- Flag-off `404` and production fail-closed startup.

Integration tests (disposable PostgreSQL) must additionally prove the
persistence, authorization, idempotency, concurrency, audit-transactionality,
and zero-ledger-effect behaviors already listed in ADR-0026 through ADR-0028.
Contract tests alone are not implementation evidence.

## Consequences

- Gate 7B gains a reviewable per-command HTTP contract without authorizing any
  route or behavior change.
- Strict validation, string-only decimals, exact permissions, persisted-warehouse
  scoping, allowlisted DTOs, and explicit error codes move from convention to
  proposal text.
- Internal offset pagination and internal error-code additions are explicitly
  marked for canonical migration, so they cannot silently become public API.
- Ledger posting, canonical promotion, and production enablement remain separate
  future gates.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- Route registration or handlers.
- Validation schemas or DTO code.
- Service or transaction code.
- Permission allowlist changes.
- Schema or migration changes.
- Seed or fixture changes.
- Feature-flag registration.
- Production configuration changes.
- Any change to `PurchaseOrderService.receive()`.
- Any change to Gate 7A read-only behavior.
- Canonical API promotion or OpenAPI generation.
- Production enablement.
