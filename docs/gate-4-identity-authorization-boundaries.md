# Gate 4: Identity and Authorization Target Boundaries

**Status:** Implemented boundary, inactive at runtime
**ADR:** `adr/0016-target-architecture-transition.md`
**Runtime effect:** None. The Express, Prisma, Pages Router, authentication-provider,
and deployment paths remain the active reference implementation.

## Purpose

Gate 4 introduces pure, database-free rules for the first target transition slice:
identity/session lifecycle claims, organization membership, permission evaluation, and
warehouse authorization. It captures target behavior without adapting any reference
route or service and does not change the active Prisma schema or migrations.

## Packages

| Package | Public responsibility | Allowed dependencies | Prohibited dependencies |
| --- | --- | --- | --- |
| `@stokku/domain` | Identity/session lifecycle types, roles, permission catalog, authorization and role-assignment decisions | None | HTTP frameworks, ORMs, React, Next.js, environment readers, credentials |
| `@stokku/validation` | Strict serializable boundary schemas | `@stokku/domain`, Zod | Database access, HTTP frameworks, React, environment readers |
| `@stokku/contracts` | DTO schemas, public decision types, stable denial codes | `@stokku/domain`, `@stokku/validation` | ORM entities, HTTP framework types, credentials |
| `@stokku/test-fixtures` | Deterministic in-memory builders and disposable identifiers | `@stokku/domain` | Production credentials, environment variables, database clients |

Each package has a public `src/index.ts`, package-local build/lint/typecheck/test
commands, and dependency-boundary tests. None is imported by the deployed API or web
runtime in this gate.

## Target Authorization Rules

1. Identity must be active and email-verified.
2. Session must be active, unexpired, and not revoked.
3. Membership is the sole proof of organization access. A request organization ID is
   only a selector and must equal the resolved membership organization ID.
4. Missing, inactive, or cross-identity memberships deny access.
5. Roles and permissions are finite allowlists. Wildcards and unknown permission
   grants are denied.
6. Warehouse access is explicit. An empty assignment set grants no warehouse access.
7. `OWNER` and `ADMIN` do not imply warehouse-wide access. Only the explicit
   `organization-wide` scope grant does.
8. Normal role changes cannot assign `OWNER`; owner transfer remains a separate,
   future named command. Self-promotion and equal-or-higher promotion are denied.

## Reference Boundary

The target terms intentionally differ from active reference names:

| Target term | Reference term | Gate 4 handling |
| --- | --- | --- |
| `IdentityPrincipal` | `User` and JWT payload | Target type only; no runtime adapter |
| `SessionClaim` | `RefreshSession`, JWT, refresh cookie | Lifecycle metadata only; no credential material |
| `OrganizationMembership` | `OrganizationMember` | Target type only; no Prisma import |
| `WarehouseScope` | `OrganizationMemberWarehouse` and `warehouseScope.ts` | Explicit target union; no reference middleware change |
| `AuthorizationContext` | `AuthRequest.user` plus middleware queries | Target type only; no Express dependency |

Reference behavior where `OWNER`/`ADMIN` gain implicit warehouse-wide access and
custom roles can contain arbitrary permission strings is not adopted by this target
boundary. It remains unchanged in the reference runtime until a later approved
adapter/parity slice.

## Migration Boundary

This gate adds no Prisma schema, migration, seed, database query, HTTP route, cookie,
provider credential, deployment, or production configuration change. No adapter may
activate the target packages in an API route until a subsequent approved slice proves
contract, authorization, persistence, and rollback parity against a disposable local
PostgreSQL database.

Active paths that must remain untouched during Gate 4 include:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/**`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/middleware/rbac.ts`
- `apps/api/src/middleware/warehouseScope.ts`
- `apps/api/src/modules/auth/**`
- `apps/web/**`

## Next: Gate 5

Gate 4 is consumed by `docs/gate-5-authorization-adapter-parity.md` (ADR-0017),
which proves contract, authorization, persistence, and rollback parity against a
disposable local PostgreSQL database. Gate 5 reuses the reference auth middleware
and `assertWarehouseAccess` semantics but does not modify them, and it remains
inactive unless `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true`.

## Verification

Package tests cover same-tenant access, cross-tenant selector denial, assigned and
unassigned warehouses, explicit owner/admin scope boundaries, inactive memberships,
revoked sessions, unknown permissions, and privilege escalation. These are pure unit
tests using deterministic fixtures and never use a database or credentials.
