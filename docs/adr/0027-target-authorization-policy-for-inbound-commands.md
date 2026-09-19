# ADR-0027: Target Authorization Policy For Inbound Commands

## Status

Proposed for Gate 7B prerequisite review; implementation not approved

## Date

2026-09-19

## Owners

Security, Principal Engineering, Product, Backend, Database Architecture, QA

## Related ADRs

- ADR-0003: Tenant and Warehouse Authorization
- ADR-0004: Authentication and Session Model
- ADR-0007: API Versioning and Command Contract
- ADR-0016: Target Architecture Transition
- ADR-0017: Authorization Adapter Parity Probe
- ADR-0019: Receiving Workflow Boundary
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring

## Problem

Gate 7B needs target authorization for two distinct operations:

- A purchasing actor selects or amends a purchase order's planned receiving
  warehouse.
- A warehouse actor creates, works, reviews, or voids a receiving draft at that
  warehouse.

The target authorization boundary correctly requires finite permissions, active
membership, and explicit warehouse scope. The current reference persistence and
middleware cannot meet that boundary without an explicit transition decision:

- `OrganizationMember` has no independently persisted active/inactive lifecycle.
- Legacy `RolePermission` accepts arbitrary strings and seeded `OWNER`/`ADMIN`
  roles use `*`.
- Legacy middleware grants `OWNER` and `ADMIN` implicit organization-wide warehouse
  access.
- Target authorization requires explicit assigned scope, has no persisted
  organization-wide grant, and denies unknown permission grants.
- The membership-to-warehouse migration initially assigned every existing membership
  to every organization warehouse to preserve legacy access, so those rows do not
  prove deliberate least-privilege receiving authority.

Without resolving these differences, a Gate 7B route could accidentally permit
legacy wildcards, implicit administrative warehouse access, an inactive membership,
or a migration-backfilled assignment to authorize a receiving mutation.

This ADR defines a target authorization planning baseline. It does not approve
schema, migration, runtime permission changes, routes, feature flags, seed changes,
receiving drafts, receipt posting, inventory effects, or production enablement.

## Context

The target architecture requires membership as the sole tenant authority. An
organization selector, JWT claim, `User.organizationId`, request header, URL value,
or request body is not proof of tenant access. Target authorization also uses a
finite permission catalog and explicit warehouse scope.

The reference authorization behavior remains transition evidence only:

- `rbac.ts` reads arbitrary role-permission strings and honors `*`.
- `warehouseScope.ts` treats `OWNER` and `ADMIN` as globally warehouse-authorized.
- The target Prisma adapter currently maps membership status from `User.isActive`
  because membership state is not stored independently.
- The current adapter preserves assigned-role permission strings. The domain then
  fails closed if any grant is unknown. Earlier Gate 5 documentation inaccurately
  described this as filtering unknown grants.

An organization-wide purchasing permission does not require a warehouse-wide scope
grant: selecting a planned destination is commercial authoring, not physical
warehouse execution. The selected warehouse still must be active and belong to the
actor's organization.

## Decision Drivers

- Membership lifecycle must be independently revocable and auditable.
- Warehouse operators must receive only the floor authority explicitly granted to
  their membership.
- A finite capability catalog must replace legacy wildcard permission semantics for
  target routes.
- Purchase-order destination authoring must not be granted by warehouse assignment.
- Draft review requires separation of duties even when a user holds both permissions.
- Legacy routes must remain functional until their migration is explicitly approved.

## Alternatives

### Alternative 1: Reuse legacy RBAC and warehouse middleware

Benefits:

- Minimal immediate implementation effort.
- Existing purchase-order and receiving routes already use it.

Costs:

- Wildcards and arbitrary permission strings remain authorization inputs.
- `OWNER` and `ADMIN` retain role-derived warehouse-wide access.
- Membership cannot be independently deactivated.
- Target permission and scope requirements are bypassed.

Decision:

- Rejected for all new target-authorized inbound commands.

### Alternative 2: Treat every owner or admin as organization-wide by convention

Benefits:

- Matches the reference runtime's current behavior.
- Avoids a new persisted organization-wide scope grant.

Costs:

- A role becomes proof of physical-site access.
- Administrative access cannot be narrowed without changing the role.
- Contradicts the target explicit-scope boundary and weakens least privilege.

Decision:

- Rejected.

### Alternative 3: Translate legacy wildcard grants to all target permissions

Benefits:

- Existing owners and admins keep access during transition.
- Fewer initial role-remediation steps.

Costs:

- A previously unbounded grant silently becomes every present and future target
  permission.
- It defeats finite permission review and prevents safe rollout of new capabilities.

Decision:

- Rejected.

### Alternative 4: Use finite target grants, independent membership state, and
explicit warehouse assignments

Benefits:

- Fails closed for legacy wildcard or unknown grant data.
- Separates commercial organization authority from physical warehouse scope.
- Supports immediate membership revocation and clear audit history.
- Allows a narrow inbound mutation slice without changing legacy route behavior.

Costs:

- Requires a target authorization-policy persistence and migration design.
- Existing assignment and role data must be remediated before a membership can use
  Gate 7B permissions.
- Adds tests for lifecycle, grant provenance, and separation of duties.

Decision:

- Selected planning direction.

## Decision

### Tenant Authority And Lifecycle

An active organization membership is the sole authority for organization access.
Every Gate 7B command must resolve at execution time:

1. Active, verified identity.
2. Active, unexpired, unrevoked session.
3. Active organization.
4. Active membership for the actor and selected organization.

A supplied organization selector can select a membership only when it equals that
membership's organization. It cannot establish or switch tenant authority. Missing,
inactive, cross-identity, or cross-organization membership must deny before any
purchase-order, warehouse, or receiving-draft record is read.

The target membership lifecycle must persist at least:

- `ACTIVE` or `INACTIVE` status.
- Deactivation and reactivation timestamps.
- Actor membership or identity responsible for the change.
- Bounded safe reason.
- Authorization/scope revision for cache and session invalidation.

Normal access removal must deactivate rather than hard-delete membership. A
deactivated membership immediately denies all tenant and warehouse reads or writes,
even if the identity and an issued access token remain active. Identity deactivation
is broader and disables every membership for that identity.

Membership reactivation must not restore previous custom-role grants or warehouse
assignments. An authorized actor must explicitly grant them again, with audit
evidence. Refresh sessions should be revoked on membership deactivation as defense
in depth; request-time membership validation remains mandatory.

### Finite Inbound Permission Catalog

The proposed target permissions are:

| Permission | Purpose | Scope |
| --- | --- | --- |
| `purchase_order.planned_warehouse.set` | Set or amend a purchase order's planned receiving warehouse. | Organization |
| `receiving.draft.read` | Read receiving-draft queues and details. | Warehouse |
| `receiving.draft.create` | Create a draft for an eligible purchase order. | Warehouse |
| `receiving.draft.update` | Change mutable `DRAFT` content. | Warehouse |
| `receiving.draft.submit` | Submit a draft for review. | Warehouse |
| `receiving.draft.approve` | Approve a submitted draft. | Warehouse |
| `receiving.draft.reject` | Reject a submitted draft. | Warehouse |
| `receiving.draft.void` | Void a permitted pre-posting draft. | Warehouse |

`receiving.receipt.post` is intentionally excluded from the runtime target catalog
and role matrix. It remains a future reserved name for the separate ledger/posting
gate and must be unavailable and ungrantable until that gate is approved.

`inventory.read` remains the temporary Gate 7A receiving-queue permission only. It
does not authorize receiving-draft commands.

### Role And Grant Policy

Target effective permissions are the finite union of a system-role bundle and an
optional target custom-role overlay. Roles never establish membership, tenant
authority, warehouse assignment, or organization-wide warehouse scope.

| System role | Proposed Gate 7B default permissions |
| --- | --- |
| `OWNER` | Every currently approved finite target permission; warehouse actions still require the applicable scope and the effective bundle remains subject to separation of duties. |
| `ADMIN` | None by default. |
| `INVENTORY_MANAGER` | `receiving.draft.read`, `receiving.draft.approve`, `receiving.draft.reject`, `receiving.draft.void`. |
| `WAREHOUSE_STAFF` | `receiving.draft.read`, `receiving.draft.create`, `receiving.draft.update`, `receiving.draft.submit`, `receiving.draft.void`. |
| `CASHIER` | None. |
| `VIEWER` | None. |

A purchasing operator is an approved target custom role rather than a new system
role in this scope. Its minimum required permission is
`purchase_order.planned_warehouse.set`.

The system-role table states default bundles, not a bypass for the separation rule:
no actor may have both `receiving.draft.create`, `receiving.draft.update`, or
`receiving.draft.submit` and either review permission. `INVENTORY_MANAGER` and
`WAREHOUSE_STAFF` satisfy this by default. An `OWNER` must be explicitly configured
as either an operator or a reviewer for the inbound workflow and cannot receive the
conflicting bundle.

Target custom roles:

- May contain only catalogued permission codes.
- May not result in an effective grant containing a create, update, or submit
  capability with either `receiving.draft.approve` or `receiving.draft.reject`.
- Must not contain `*`, prefixes, patterns, aliases, or unknown strings.
- Must not grant membership lifecycle changes, warehouse scope, organization-wide
  scope, owner transfer, or any capability beyond the grantor's effective finite
  permissions.
- Must be transactionally audited on creation, update, assignment, revocation,
  disablement, and any authority-changing use.
- Must not be inferred from legacy `po.*`, `receipt.*`, or other reference
  permission names.

### Organization And Warehouse Scope

Planned-warehouse authoring is an organization-scoped purchasing command. It
requires `purchase_order.planned_warehouse.set` and no warehouse-scope authorization
input. The target warehouse must still be active and belong to the actor's
organization. A warehouse assignment alone never grants this purchasing authority.

Every receiving-draft operation is warehouse-scoped. It requires the named
permission and an explicit, active assignment for the persisted warehouse on the
draft or purchase order. A request must not select an alternate warehouse for a
draft already linked to one.

Gate 7B does not introduce organization-wide warehouse scope. All receiving-draft
actions use `assigned-warehouses`, and an empty assignment set grants no physical
warehouse authority. `OWNER` and `ADMIN` do not bypass that requirement. The target
`organization-wide` scope union remains deferred until a separate ADR defines its
persisted grant, lifecycle, revocation, audit, migration, and test strategy.

### Inbound Command Invariants

For planned-warehouse authoring:

- The selected warehouse must be active and in the actor organization.
- The selected warehouse need not be assigned to the purchasing actor.

For receiving drafts:

- Creation requires an active same-organization planned warehouse, purchase-order
  state `SENT` or `PARTIALLY_RECEIVED`, open purchase-order quantity, exact equality
  between draft warehouse and `PurchaseOrder.plannedWarehouseId`, permission, and
  explicit assignment.
- Read, update, submit, approve, reject, and void authorize against the persisted
  draft warehouse, never a caller-selected warehouse.
- An actor who can create, update, or submit a receiving draft cannot hold
  `receiving.draft.approve` or `receiving.draft.reject` through any system-role or
  custom-role bundle. This stronger separation of duties eliminates self-review and
  prevents an administrator from bypassing it by authoring a custom role.
- An operator can void only their own `DRAFT`. A reviewer-capable actor can void a
  `SUBMITTED` or `APPROVED` draft before posting. All other state or ownership
  combinations deny.
- Warehouse deactivation blocks destination selection and all receiving-draft
  mutations. Historical records remain available only through separately authorized
  historical or audit views; remediation and reactivation policy are out of scope.

### Legacy Transition Policy

Gate 7B target routes must not authorize through legacy `rbac.ts`,
`warehouseScope.ts`, `RolePermission.permission = '*'`, or legacy system-role data.

Future implementation must establish isolated target authorization-policy storage,
or an equivalently isolated target grant projection, governed by the finite catalog.
While legacy routes need legacy authorization, the old tables remain unchanged.

- A legacy wildcard never maps to all target permissions.
- An unknown, wildcard, or malformed target custom grant makes the affected target
  policy invalid and denies target inbound access until remediation.
- It is forbidden to silently filter invalid target grants and allow the remainder.
- Target system-role bundles must be seeded or projected only from the approved
  finite catalog and never store `*`.
- Warehouse assignments created by the legacy all-warehouse migration backfill are
  legacy-unverified. They cannot activate Gate 7B receiving authority until an
  authorized assignment action explicitly attests or replaces them.
- Historical purchase orders with null planned warehouse remain outside Gate 7B;
  planned destination must not be inferred from historical receipts.

### Audit And Failure Rules

For a first execution, the business state change, idempotency result, and
append-only audit event must commit in one transaction. Audit or idempotency failure
must roll back the inbound command.

Required successful inbound events:

- `purchase_order.planned_warehouse.set`
- `purchase_order.planned_warehouse.changed`
- `purchase_order.planned_warehouse.amended`
- `receiving.draft.created`
- `receiving.draft.updated`
- `receiving.draft.submitted`
- `receiving.draft.approved`
- `receiving.draft.rejected`
- `receiving.draft.voided`

Membership, role, permission, and warehouse-scope grant/revocation changes also
require transactional, append-only audit evidence. Audit payloads must include safe
actor identity/membership, organization, warehouse, PO or draft, command or
idempotency ID, request ID, and bounded reasons where relevant. They must exclude
credentials, cookies, authorization headers, raw request bodies, raw ORM objects,
and cross-tenant data.

Best-effort authorization-denial logging may support security diagnostics, but it
never substitutes for transactional command evidence.

## Implementation Blockers

- Exact target authorization-policy schema, relationships, and migration SQL.
- Membership status and authorization/scope-revision persistence design.
- Target system-role bundle and custom-role overlay storage model.
- Provenance or replacement workflow for legacy-backfilled warehouse assignments.
- Exact authoritative adapter/runtime path and removal strategy for dual legacy and
  target authorization behavior.
- Purchase-order authoring and receiving-draft API contracts.
- Shared idempotency implementation from ADR-0025.
- Full security review, disposable PostgreSQL tests, rollback plan, and production
  impact review.

## Required Verification Before Implementation Approval

- Every approved permission allows only its role-matrix and custom-role policy
  behavior; unknown, wildcard, prefix, and malformed grants deny.
- Planned-warehouse authoring succeeds with purchasing permission and no warehouse
  assignment, but selected warehouse must be active and in the same organization.
- Receiving-draft actions require exact active warehouse assignment; owner and admin
  do not bypass assignment and no organization-wide draft scope exists.
- Inactive membership denies despite active identity and a previously issued token;
  reactivation does not restore historical grants automatically.
- Missing, expired, or revoked sessions deny; target authorization is evaluated with
  execution-time identity, session, organization, and membership state.
- Cross-tenant identifiers reveal neither existence nor data. Missing, cross-tenant,
  or inactive warehouses return `404 NOT_FOUND`; in-tenant scope or permission denial
  returns `403 FORBIDDEN`.
- No actor's effective system-role and custom-role bundle can grant both draft
  creation/update/submit and draft approval/rejection capabilities; creator
  approval and rejection attempts are denied.
- Legacy wildcard grants, implicit administrative global scope, and all-warehouse
  migration-backfill assignments cannot authorize target inbound commands.
- Successful state transition, idempotency result, and audit evidence commit
  together; induced audit or idempotency failure rolls back state. Replay does not
  create a duplicate transition audit event.
- Planned-warehouse and draft commands create no goods receipt, receipt line, stock
  movement, stock-level, ledger, putaway, or purchase-order received-quantity effect.
- Empty-database and existing-data disposable PostgreSQL migration tests include
  legacy wildcard roles, unknown grants, inactive memberships, legacy assignment
  backfills, null planned warehouses, and inactive warehouses.

## Consequences

- New inbound commands can use a finite, fail-closed target authorization model
  without silently inheriting legacy wildcard or global-scope semantics.
- Purchase-order destination authoring is correctly separated from physical
  warehouse authority.
- Gate 7B remains planning-only and blocked pending a dedicated target-policy
  migration and implementation ADR.
- Receipt posting, inventory and ledger effects, legacy route replacement, and
  production enablement remain out of scope and NO-GO.
