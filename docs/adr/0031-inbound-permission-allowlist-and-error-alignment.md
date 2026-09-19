# ADR-0031: Inbound Permission Allowlist And Error-Code Alignment

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Security, Principal Engineering, Backend, QA, Product

## Related ADRs

- ADR-0007: API Versioning and Command Contract
- ADR-0016: Target Architecture Transition
- ADR-0017: Authorization Adapter Parity Probe
- ADR-0024: Receiving Draft Workflow
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal
- ADR-0029: Receiving Draft API Contract Proposal
- ADR-0030: Receiving Draft Implementation Slice And Rollout Plan

## Problem

The draft slice cannot be implemented until two small but blocking decisions are
locked:

1. The finite target permission allowlist (`packages/domain/src/types.ts`
   `PERMISSIONS`) contains 14 codes and no inbound draft permission. Every
   draft route in ADR-0029 would therefore deny with `UNKNOWN_PERMISSION`
   before any scope check runs.
2. The 401 codes diverge: shared `authMiddleware`
   (`apps/api/src/middleware/auth.ts`) emits `UNAUTHORIZED` for bearer failures,
   while the target deny mapper
   (`apps/api/src/target-authorization/authorization-mapper.ts`) emits
   `UNAUTHENTICATED` for revoked or expired sessions. ADR-0029 proposes
   `UNAUTHENTICATED` for its new 401s without stating what happens to the
   shared middleware, leaving each future slice free to invent its own code.

A third question must be closed at the same time: whether the internal
`OVER_RECEIPT` code belongs in the canonical stable-code list, the domain deny
reasons, or only in the draft route layer.

This ADR proposes the exact allowlist delta, role-bundle delta, and error-code
ownership. It authorizes no code, permission, migration, route, or production
change.

## Context

Current verified facts:

- `PERMISSIONS` has 14 entries; `isPermission()` and `authorize()` derive
  entirely from that list, so adding codes is sufficient for recognition with
  no logic change.
- `ROLE_PERMISSIONS.OWNER` is `PERMISSIONS` (everything). Every other role has
  an explicit bundle.
- ADR-0027 separation-of-duties rule: no effective bundle may combine draft
  create/update/submit with approve/reject. `INVENTORY_MANAGER` (reviewer) and
  `WAREHOUSE_STAFF` (operator) already satisfy this by default.
- The deny mapper already maps `SESSION_REVOKED` and `SESSION_EXPIRED` to
  `401 UNAUTHENTICATED`; all other denies map to `403 FORBIDDEN` except
  `UNKNOWN_PERMISSION` (`400 VALIDATION_FAILED`).
- `authMiddleware` emits `UNAUTHORIZED` for missing bearer, invalid claims,
  unknown or inactive user, and invalid or expired JWT, and `FORBIDDEN` for
  unverified email. It is shared by every operational route including Gate 7A.
- `docs/API.md` section 2 lists stable codes including `UNAUTHENTICATED`,
  `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT`, `IDEMPOTENCY_KEY_REUSED`, and
  `INVALID_STATE_TRANSITION`, but not `OVER_RECEIPT` and not `UNAUTHORIZED`.
- No domain `AuthorizationDenyReason` exists for over-receipt, version
  mismatch, idempotency reuse, or state transition; those are command-layer
  conflicts, not authorization denies.

## Alternatives

### Alternative 1: Add permissions to the allowlist and leave role bundles untouched

Pros:

- Smallest diff.

Cons:

- New codes are recognized but granted to nobody except `OWNER` (via
  `PERMISSIONS`), silently making `OWNER` the only draft actor.
- Reviewer and operator roles from ADR-0027 have no runtime effect.
- Separation of duties is unenforceable at the bundle level.

Decision:

- Rejected.

### Alternative 2: Keep `OWNER: PERMISSIONS` and enforce separation only per draft

Pros:

- One-line allowlist diff.
- `OWNER` keeps universal access.

Cons:

- `OWNER` simultaneously holds create and approve, contradicting the ADR-0027
  effective-bundle rule.
- Separation depends entirely on the per-request creator check, which an
  administrator can never fail closed at the grant level.
- A future custom role combining both capabilities has no bundle-level guard.

Decision:

- Rejected.

### Alternative 3: Change shared `authMiddleware` to emit `UNAUTHENTICATED` everywhere now

Pros:

- Single 401 code across all routes.

Cons:

- Touches every operational route, its tests, and client error handling in one
  slice.
- Gate 7A evidence and existing auth tests assert the current codes.
- Big-bang error-code migration with no slice isolation or rollback boundary.

Decision:

- Rejected for this slice. Deferred to a dedicated canonical-alignment ADR
  with its own test migration.

### Alternative 4: Exact allowlist plus explicit role bundles, with owned error-code coexistence

Pros:

- New codes are recognized and granted exactly per the ADR-0027 matrix.
- `OWNER` no longer implicitly combines operator and reviewer power.
- Each 401 code keeps a single owner: bearer failures stay `UNAUTHORIZED` in
  shared middleware; session revocation and expiry stay `UNAUTHENTICATED` in
  the target mapper; no route invents a third code.
- `OVER_RECEIPT` stays internal to the draft route layer until canonical
  promotion.

Cons:

- `OWNER` loses implicit approve/reject and must act as operator or reviewer
  per workflow, which is intended but needs operator communication.
- Two 401 codes coexist until the canonical-alignment ADR lands.

Decision:

- Selected proposal direction.

## Decision

### Permission Allowlist Delta

Append exactly these eight codes to `PERMISSIONS` in `packages/domain/src/types.ts`,
in this order, with no other change to the file:

```ts
'purchase_order.planned_warehouse.set',
'receiving.draft.read',
'receiving.draft.create',
'receiving.draft.update',
'receiving.draft.submit',
'receiving.draft.approve',
'receiving.draft.reject',
'receiving.draft.void',
```

`receiving.receipt.post` is intentionally absent. It remains reserved for the
ledger/posting gate and must stay ungrantable.

No new `AuthorizationDenyReason` is added. Over-receipt, version mismatch,
idempotency reuse, state transition, and retry exhaustion are command-layer
results mapped at the route layer per ADR-0029, not authorization denies.

### Role-Bundle Delta

Replace `ROLE_PERMISSIONS` in `packages/domain/src/permissions.ts` with exactly
this matrix. No hierarchy numbers change. No wildcard is introduced.

```ts
OWNER: [
  'identity.session.read',
  'identity.session.revoke',
  'organization.members.read',
  'organization.members.manage',
  'organization.roles.read',
  'organization.roles.manage',
  'warehouse.read',
  'warehouse.manage',
  'warehouse.scope.manage',
  'inventory.read',
  'inventory.adjust.request',
  'inventory.adjust.approve',
  'inventory.transfer.execute',
  'audit.read',
  'purchase_order.planned_warehouse.set',
  'receiving.draft.read',
  'receiving.draft.create',
  'receiving.draft.update',
  'receiving.draft.submit',
  'receiving.draft.void',
],
ADMIN: [
  // unchanged: the 14 existing codes, no inbound draft permission
],
INVENTORY_MANAGER: [
  'organization.members.read',
  'warehouse.read',
  'inventory.read',
  'inventory.adjust.request',
  'inventory.adjust.approve',
  'inventory.transfer.execute',
  'receiving.draft.read',
  'receiving.draft.approve',
  'receiving.draft.reject',
  'receiving.draft.void',
],
WAREHOUSE_STAFF: [
  'warehouse.read',
  'inventory.read',
  'inventory.adjust.request',
  'inventory.transfer.execute',
  'receiving.draft.read',
  'receiving.draft.create',
  'receiving.draft.update',
  'receiving.draft.submit',
  'receiving.draft.void',
],
CASHIER: ['inventory.read'],       // unchanged
VIEWER: ['warehouse.read', 'inventory.read'],  // unchanged
```

Consequences of this matrix:

- `OWNER` holds six of eight inbound codes: everything except
  `receiving.draft.approve` and `receiving.draft.reject`. An owner acts as
  operator or purchasing authority in this slice, never as draft reviewer.
- Reviewer power lives in `INVENTORY_MANAGER` plus target custom roles that
  contain only review capabilities.
- Operator power lives in `WAREHOUSE_STAFF` plus target custom roles that
  contain only operator capabilities.
- Purchasing power (`purchase_order.planned_warehouse.set`) lives in `OWNER`
  plus an approved target custom purchasing role, never in warehouse assignment
  alone.
- No system bundle combines create/update/submit with approve/reject, so the
  ADR-0027 effective-bundle rule holds by construction for system roles;
  custom-role validation must enforce the same rule with tests.

### Error-Code Ownership

- Bearer failures (missing header, invalid claims, unknown or inactive user,
  invalid or expired JWT) stay owned by shared `authMiddleware` and keep code
  `UNAUTHORIZED`. This proposal changes no line in that file.
- Session revocation and expiry evaluated through target `authorize()` stay
  owned by the deny mapper and keep code `UNAUTHENTICATED`. This proposal
  changes no line in that file.
- Draft routes use the mapper for authorization denies and route-local strict
  parsing for `VALIDATION_FAILED`. They do not invent a new 401 code: bearer
  problems surface as `UNAUTHORIZED` from the shared middleware before the
  route runs; revoked or expired sessions surface as `UNAUTHENTICATED` from
  the mapper inside the route.
- `OVER_RECEIPT` (`409`, allowlisted details
  `{ purchaseOrderItemId, openQuantity, acceptedQuantity }`) stays owned by the
  draft route layer only. It is not added to `docs/API.md` section 2, to the
  domain deny reasons, or to any shared error helper until a canonical
  promotion ADR approves it.
- `details` on every draft error carries only in-scope, non-secret data.

### Custom-Role Enforcement

Target custom roles for this slice:

- May contain only codes from the extended allowlist above.
- Must never produce an effective grant combining create/update/submit with
  approve/reject.
- Must never contain `*`, prefixes, patterns, aliases, or unknown strings.
- An invalid target grant denies target inbound access; silent filtering and
  allow-the-remainder is forbidden per ADR-0027.

### Migration Character

- Pure code change in `packages/domain` (two files). No Prisma migration, no
  database change, no seed change.
- Legacy `RolePermission` strings are untouched; legacy routes keep their
  behavior until their own migration ADR.
- `authorize()` logic is untouched; only its input tables change.

## Implementation Blockers Remaining

Even after this proposal is approved, application remains blocked until:

- ADR-0026, ADR-0027 storage, and ADR-0028 persistence implementations land
  and verify.
- ADR-0029 contract and ADR-0030 slice plan are approved.
- Domain package tests cover the extended allowlist, the new matrix, and the
  separation rule.
- Adapter and contract tests cover `UNAUTHORIZED` vs `UNAUTHENTICATED`
  ownership and the internal `OVER_RECEIPT` mapping.
- Security review and production-impact review are recorded.

## Test Matrix Proposal

Domain package tests (`packages/domain`):

- Every new code is recognized by `isPermission()`.
- Matrix assertions per role exactly match the table above.
- `OWNER` lacks approve/reject; reviewer and operator bundles are disjoint on
  create/update/submit vs approve/reject.
- Unknown, wildcard, prefix, and empty grants deny per existing rules.

Adapter and contract tests (disposable fixtures, no production data):

- Missing bearer returns `401 UNAUTHORIZED` (shared middleware, unchanged).
- Revoked session returns `401 UNAUTHENTICATED` via the mapper.
- Expired session returns `401 UNAUTHENTICATED` via the mapper.
- Unknown inbound permission string returns `400 VALIDATION_FAILED`.
- Missing inbound permission returns `403 FORBIDDEN`.
- Over-acceptance returns `409 OVER_RECEIPT` with allowlisted details and no
  state change; the code appears nowhere in shared helpers or canonical docs.

## Consequences

- The draft slice gains an exact, minimal allowlist and bundle delta with no
  logic change to `authorize()`.
- Separation of duties holds at the grant level, not just per request.
- Error-code coexistence is explicit and owned instead of drifting per route.
- Ledger posting, canonical promotion, and production enablement remain
  separate future gates.
- Production remains NO-GO.

## Rejected Scope

This ADR does not approve:

- Any edit to `packages/domain/src/types.ts` or `permissions.ts`.
- Any edit to shared auth middleware or the deny mapper.
- Any runtime permission grant or custom-role creation.
- Any route, service, schema, migration, or seed change.
- Any change to `PurchaseOrderService.receive()` or Gate 7A behavior.
- Canonical stable-code promotion for `OVER_RECEIPT`.
- Canonical 401-code migration.
- Production enablement.
