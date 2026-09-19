# ADR-0035: Canonical Promotion Plan For Receiving Drafts

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

Backend, Product, Security, QA, Principal Engineering

## Related ADRs

- ADR-0007: API Versioning and Command Contract
- ADR-0016: Target Architecture Transition
- ADR-0029: Receiving Draft API Contract Proposal
- ADR-0030: Receiving Draft Implementation Slice And Rollout Plan
- ADR-0031: Inbound Permission Allowlist And Error-Code Alignment
- ADR-0034: Gate 7B Implementation Approval Gate

## Problem

The draft slice is designed as internal and non-canonical
(`/api/v1/internal/inbound/receiving-drafts`, offset `{ data, pagination }`,
internal `OVER_RECEIPT`, dual 401-code coexistence). The public contract
(`docs/API.md`, ADR-0007) requires canonical paths, keyset `{ data, meta }`
collections, a stable error-code list, and OpenAPI 3.1 generation. No plan
defines how the internal surface graduates to canonical without breaking
clients, leaking scope, or silently promoting experimental codes.

Without that plan, three failure modes are likely: internal paths become de
facto public API because clients integrate against them; pagination and error
codes fork permanently between internal and canonical; or a rushed promotion
renames paths and codes in one deploy with no deprecation window.

This ADR proposes the promotion plan. It authorizes no path, code, migration,
or production change.

## Context

Locked inputs:

- Internal contract (ADR-0029): eight named commands, strict schemas,
  allowlisted DTO, explicit errors, offset pagination.
- Allowlist and codes (ADR-0031): eight inbound permissions; bearer failures
  stay `UNAUTHORIZED`; session expiry stays `UNAUTHENTICATED`; `OVER_RECEIPT`
  stays route-internal.
- Canonical rules (ADR-0007, `docs/API.md` sections 1–7): `/api/v1` versioning
  with `/api/v2` for breaking changes, named commands, allowlisted DTOs,
  request-ID errors, keyset pagination (`limit` bounded to 100, default 25,
  opaque cursor with no tenant authority), OpenAPI 3.1 generated from
  contracts, `Deprecation` and `Sunset` headers plus migration notes, no
  GraphQL pilot API.
- Slice precedent: internal routes ship first behind a disabled-by-default
  flag with production fail-closed guards (ADR-0030).

## Alternatives

### Alternative 1: Keep internal paths as the permanent public API

Pros:

- No migration work.

Cons:

- The `/internal` prefix becomes a lie; experimental pagination and codes are
  frozen as public contract.
- Keyset, stable-code, and OpenAPI guarantees in `docs/API.md` are violated.

Decision:

- Rejected.

### Alternative 2: Cut over in one deploy: rename paths, codes, and pagination together

Pros:

- Single migration event.

Cons:

- Breaking change with no deprecation window for web, mobile, and integration
  clients.
- Couples pagination migration, code promotion, and path rename into one
  unreviewable deploy with all-or-nothing rollback.

Decision:

- Rejected.

### Alternative 3: Phased promotion with dual-serve, deprecation headers, and client migration

Pros:

- Internal and canonical coexist during a bounded window with identical
  authorization, validation, and persistence behavior.
- Clients migrate on a schedule with observable usage metrics.
- Each phase (paths, pagination, codes, OpenAPI, internal removal) is
  independently reviewable and rollback-safe.

Cons:

- Temporary dual maintenance of two route registrations over one service.
- Requires usage telemetry and a deprecation owner.

Decision:

- Selected proposal direction.

## Decision

### Promotion Phases

Phase A — internal slice proven (entry criteria, not part of this promotion):

- Draft slice implemented and verified per ADR-0030 test gates on disposable
  and staging environments, operated through pilot inbound work.

Phase B — canonical paths dual-served:

- Register canonical routes alongside internal ones over the same service
  layer with zero behavior divergence:
  `POST /api/v1/receiving-drafts`, `GET /api/v1/receiving-drafts`,
  `GET /api/v1/receiving-drafts/:id`, `PATCH /api/v1/receiving-drafts/:id`,
  `POST /api/v1/receiving-drafts/:id/submit`, `/approve`, `/reject`, `/void`.
- The planned-warehouse command promotes from proposed
  `POST /api/v1/purchase-orders/:id/planned-warehouse` in the same phase after
  its own implementation verifies.
- Internal paths emit `Deprecation: true` plus a `Sunset` date and a migration
  note pointing at the canonical equivalents. Canonical paths emit no
  deprecation headers.

Phase C — pagination and codes converged:

- Canonical list responses use keyset `{ data, meta: { nextCursor, hasMore } }`
  with opaque cursors bound to the original query scope; cursors carry no
  tenant authority and are invalid outside it.
- Internal offset `{ data, pagination }` remains served during the window but
  is documented as deprecated.
- Error-code decision at promotion: either promote `OVER_RECEIPT` to the
  canonical stable list in `docs/API.md` section 2 with OpenAPI documentation,
  or remap over-acceptance to `409 CONFLICT` with allowlisted details and
  retire `OVER_RECEIPT`. The decision belongs to the promotion implementation
  ADR, not this plan; this plan forbids silently serving both meanings.
- Single 401-code migration lands here: one canonical code for bearer and
  session failures, with a dedicated alignment ADR migrating shared middleware
  tests, Gate 7A evidence references, and client handling together.

Phase D — OpenAPI and client migration:

- Generate OpenAPI 3.1 from the canonical contracts; contract tests assert
  status codes, error codes, keyset pagination, authorization matrix, and
  sensitive-field exclusion against the canonical paths.
- Web, mobile, and integration clients migrate to canonical paths; usage
  metrics on internal paths must trend to zero before removal.
- No new feature is built on internal paths after Phase B begins.

Phase E — internal removal:

- Remove internal route registrations and their flag wiring in a forward
  migration with its own ADR, verification, and rollback note.
- Internal paths return the standard `404 NOT_FOUND` catch-all after removal.

### Non-Negotiable Rules

- Identical authorization, validation, persistence, idempotency, audit, and
  ledger-boundary behavior on both surfaces during dual-serve; the promotion
  changes addressing and encoding, never security semantics.
- Cursor values are opaque, signed or random, and scope-bound; they never embed
  organization IDs, warehouse IDs, or permission claims.
- Breaking changes after promotion use `/api/v2`; no silent v1 semantic
  change.
- GraphQL remains out of scope for the pilot promotion.

## Implementation Blockers Remaining

A future promotion implementation ADR must still lock:

- Exact canonical path table and flag wiring for dual-serve.
- Keyset cursor construction, signing, expiry, and invalidation rules.
- Final error-code table including the `OVER_RECEIPT` promote-or-remap
  decision and the single 401-code migration.
- `Deprecation` and `Sunset` values with owner and dates.
- OpenAPI generation wiring and contract-test matrix.
- Client migration schedule with usage metrics and removal criteria.
- Security review and production-impact review for the dual-serve window.

## Test Matrix Proposal

- Parity tests proving identical allow, deny, validation, DTO, idempotency,
  and audit behavior across internal and canonical paths for every command.
- Keyset tests: cursor opacity, scope binding, cross-scope rejection,
  pagination stability under concurrent inserts, limit bounds.
- Deprecation-header assertions on internal paths and absence on canonical.
- OpenAPI snapshot tests for paths, schemas, codes, and pagination shapes.
- Client-migration telemetry tests and internal-removal `404` verification.

## Consequences

- Promotion becomes a planned, phased, telemetry-driven migration instead of
  a flag-day rename.
- Internal experimental surface cannot silently harden into public API.
- Ledger, authorization, and audit semantics stay fixed while addressing and
  encoding evolve.
- Production remains NO-GO; no promotion phase enables production beyond the
  existing pilot topology without its own release approval.

## Rejected Scope

This ADR does not approve:

- Any canonical path registration.
- Any pagination, error-code, or middleware change.
- Any OpenAPI generation wiring.
- Any deprecation header values or sunset dates.
- Any client migration or internal-path removal.
- Posting implementation, seed changes, or production enablement.
