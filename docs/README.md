# Stokku Documentation

## Authority

This directory is being re-baselined for the WMS rebuild. The documents below are
the authoritative Phase 0 set. Older documents remain in the repository as
discovery evidence and are explicitly historical unless listed here.

Use exact filenames as shown. The repository runs on a case-insensitive filesystem,
but links and tooling should remain portable to case-sensitive CI environments.

| Decision                                   | Authority                                          | Status            |
| ------------------------------------------ | -------------------------------------------------- | ----------------- |
| Product goals, users, scope, priorities    | `PRD.md`                                           | Proposed baseline |
| Testable requirements                      | `SRS.md`                                           | Proposed baseline |
| System boundaries and runtime architecture | `architecture.md`                                  | Proposed baseline |
| Technology choices                         | `tech-stack.md` and `adr/`                         | Proposed baseline |
| Domain, invariants, persistence, and ERD   | `Database.md`                                      | Proposed baseline |
| External API contract                      | `API.md`                                           | Proposed baseline |
| Threat model and security controls         | `Security.md`                                      | Release baseline  |
| Navigation and warehouse workflows         | `UX.md`                                            | Proposed baseline |
| Design tokens and reusable UI behavior     | `design-system.md`                                 | Proposed baseline |
| Environments and releases                  | `Deployment.md`                                    | Proposed baseline |
| Operations, backups, and incident response | `Operations.md`                                    | Proposed baseline |
| Verification strategy                      | `Testing.md`                                       | Proposed baseline |
| Requirement-to-test mapping                | `traceability.csv`                                 | Initial matrix    |
| Completion and release gates               | `DefinitionOfDone.md` and `ProductionReadiness.md` | Release baseline  |
| Durable architecture decisions             | `adr/README.md` and individual ADRs                | Proposed baseline |
| Repository transition and dependency rules | `repository-structure.md` and ADR-0016             | Approved direction |
| Gate 4 target identity/authorization boundary | `gate-4-identity-authorization-boundaries.md`    | Implemented, inactive |
| Gate 5 authorization adapter parity probe | `gate-5-authorization-adapter-parity.md`    | Implemented, feature-flagged |

## Phase 0 Gate

Implementation of new product functionality is blocked until the following are
reviewed and accepted:

- Product boundary is WMS-only; project-management features are excluded.
- Pilot scope and non-goals are agreed.
- Target architecture and technology choices are agreed.
- Tenant and warehouse authorization model is agreed.
- Inventory ledger and projection invariants are agreed.
- API error, versioning, pagination, and idempotency contracts are agreed.
- Warehouse-floor receiving and putaway journey is agreed.
- Threat model and release-blocking controls are agreed.
- Production readiness checklist has an owner for every unchecked item.

The current implementation preceded this gate. That is recorded as an exception,
not treated as approval of its architecture. Phase 1 security hardening may modify
the reference implementation to contain known risks, but it does not waive the
rebuild gate.

## Decision Register

The proposed target stack is Next.js App Router, React 19, Hono on Node.js,
PostgreSQL 16+, Drizzle, Better Auth primitives, Zod, and TanStack Query. This is
the approved Phase 0 direction, not a mandate to rewrite the active reference
implementation in place. Migration occurs one tested vertical slice at a time under
ADR-0016.

`architecture.md`, `tech-stack.md`, `Database.md`, `API.md`, and the ADR register
are the only documents that define target architecture decisions. Where a current
reference runbook names Express, Prisma, Pages Router, React 18, or the deployed
Vercel -> Render -> Neon topology, it describes current-state evidence only.

## Documentation Status

| Classification | Location | Use |
| --- | --- | --- |
| Canonical Phase 0 | This directory's documents listed above | Requirements and proposed target decisions |
| Reference runtime | `reference/runtime/` | Current implementation, migration, and deployment evidence |
| Legacy discovery | `reference/legacy/` | Historical product and UX discovery; never a rebuild requirement |
| Superseded | `reference/superseded/` | Replaced proposals retained for decision history |

Reference documents do not silently override an approved target decision. A change
to a target decision requires a new ADR that links the decision it supersedes.

## Conflicts Requiring an ADR Before Implementation

- The historical Cloudflare Workers, GraphQL, Redis, and Supabase Realtime proposal
  conflicts with the Node/Hono REST target and is superseded.
- The Prisma/PostgreSQL 15 reference migration runbook conflicts with the
  Drizzle/PostgreSQL 16+ target. It remains necessary for reference-runtime safety
  until a persistence migration ADR and vertical slice are approved.
- Reference entities such as `StockMovement`, `StockLevel`, and `AuditLog` are not
  canonical target table names. The target ledger terminology needs an explicit
  schema transition ADR before implementation.
- Current security and operations evidence is not proof that target controls have
  been implemented. Production remains NO-GO until release evidence is complete.

The reference index records the canonical replacement for every relocated document.
