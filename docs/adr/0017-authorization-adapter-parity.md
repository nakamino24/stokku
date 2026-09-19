# ADR-0017: Authorization Adapter Parity Probe

**Status:** Approved — Implemented under feature flag (inactive by default)
**Date:** 2026-09-13  
**Owners:** CTO, Principal Engineering, Security  
**Supersedes:** None  
**Related:** ADR-0016 Target Architecture Transition, ADR-0003 Tenant and Warehouse Authorization
**Implementation:** `docs/gate-5-authorization-adapter-parity.md`

## Problem

Gate 4 introduced framework-agnostic identity and authorization domain packages (`@stokku/domain`, `@stokku/contracts`, `@stokku/validation`, `@stokku/test-fixtures`) but they remain inactive at runtime. Before committing to the target architecture for production workflows, the engineering team needs concrete evidence that:

1. Reference Prisma persistence can be adapted to target `AuthorizationContext` without schema changes.
2. Target authorization decisions produce equivalent or safer outcomes than reference middleware.
3. Known divergences (stricter permission allowlists, explicit warehouse scope) are acceptable and documented.
4. Adapters can be rolled back cleanly without migrations, schema changes, or orphaned data.

Without this evidence, the target boundary remains theoretical and the transition plan cannot proceed to operational features.

## Context

The reference runtime uses:
- `apps/api/src/middleware/auth.ts`: JWT validation, Prisma `User` rehydration, `req.user` attachment
- `apps/api/src/middleware/rbac.ts`: Role hierarchy and `requireRole()` guards
- `apps/api/src/middleware/warehouseScope.ts`: `getWarehouseScope()`, global vs assigned logic
- Implicit owner/admin warehouse-wide access
- Custom roles with arbitrary permission strings

The target boundary requires:
- Membership as sole organization authority; selectors are not proof of access
- Finite permission allowlist (14 named permissions)
- Explicit warehouse scope grant; no role-based warehouse inference
- Fail-closed for unknown permissions, inactive memberships, unverified emails, revoked sessions

A parity probe is needed to:
- Prove adapter feasibility without production risk
- Quantify divergences and confirm they are security improvements, not regressions
- Provide rollback evidence before activating target boundaries in operational routes

## Alternatives

### Alternative 1: Rewrite reference middleware in place
- **Pros:** No dual-path, immediate consistency
- **Cons:** High-risk big-bang change, difficult rollback, violates ADR-0016 incremental transition

### Alternative 2: Add target packages to production routes immediately
- **Pros:** Fastest path to adoption
- **Cons:** No parity evidence, no rollback plan, unsafe for production-grade authorization

### Alternative 3: Build isolated parity probe with feature flag and rollback evidence
- **Pros:** Low risk, measurable divergence, clean rollback, testable before production commitment
- **Cons:** Temporary dual-path maintenance, one extra route during transition
- **Selected:** This alternative

## Decision

Implement a **read-only warehouse authorization parity probe** as an isolated, feature-flagged adapter in `apps/api/src/target-authorization/`. The probe:

- Accepts a single authorization check request via `POST /api/v1/_parity/authorization/check`
- Adapts Prisma `User`, `OrganizationMember`, `OrganizationMemberWarehouse` to target `AuthorizationContext`
- Calls target `authorize(context, request, now)` from `@stokku/domain`
- Returns allow/deny decision using existing `AppError` envelope
- **Does not mutate data, change sessions, or affect reference routes**
- Runs only when `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true` (default: `false`)
- Can be rolled back by setting flag to `false` and deleting `apps/api/src/target-authorization/`

### Scope Boundary

**In scope for Gate 5:**
- Single warehouse-scoped inventory read permission check
- Prisma-to-target type adaptation
- 6 parity test scenarios including 2 expected divergences
- Fail-closed error mapping
- Rollback evidence without migrations

**Out of scope:**
- Identity/session creation or mutation
- Role assignment or privilege escalation operations
- Any data write or state change
- Production route activation (reference routes remain unchanged)
- Public API surface (route excluded from `docs/API.md`)

### Route Design

**Path:** `POST /api/v1/_parity/authorization/check`

**Rationale for `_parity` prefix:**
- Signals experimental/non-stable endpoint
- Will not conflict with future canonical Hono `/api/v1/authorization/*` routes
- Excluded from public API documentation; exists only for transition evidence
- Easy to remove without affecting API contract

**Request:**
```json
{
  "organizationId": "uuid",
  "warehouseId": "uuid",
  "permission": "inventory.read"
}
```

**Response (success):**
```json
{
  "allowed": true,
  "requestId": "req_..."
}
```

**Response (denied):**
```json
{
  "error": {
    "code": "WAREHOUSE_ACCESS_DENIED",
    "message": "You do not have access to this warehouse",
    "requestId": "req_...",
    "details": {}
  }
}
```

**Middleware chain:**
1. `requestIdMiddleware` (reference, unchanged)
2. `apiLimiter` (reference, unchanged)
3. `authMiddleware` (reference, unchanged) → `req.user`
4. Target adapter HTTP handler
5. Audit log (deny-aware, fire-and-forget)

**Feature flag:**
- Environment variable: `ENABLE_TARGET_AUTHORIZATION_ADAPTER` (default: `false`)
- Server-only; never exposed to `NEXT_PUBLIC_*` or client bundle
- Validated in `apps/api/src/config/index.ts` as required boolean config
- Added to `validateConfig()` startup checks
- Route registration conditional: if flag is `false`, route is not mounted and falls through to 404

**Config changes required:**
```typescript
// apps/api/src/config/index.ts
export const config = {
  // ... existing config ...
  features: {
    enableTargetAuthorizationAdapter: process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER === 'true',
  },
};

// Validation in server.ts or app.ts startup:
if (config.nodeEnv === 'production' && config.features.enableTargetAuthorizationAdapter) {
  logger.warn('Target authorization adapter is enabled in production');
}
```

### Adapter Architecture

**Location:** `apps/api/src/target-authorization/` (not `packages/adapters`)

**Rationale:**
- Avoids introducing `@stokku/database` dependency into shared packages
- Keeps Prisma import isolated to API layer where it already exists
- Simplifies rollback: delete folder + one route registration line
- Preserves clean dependency: `domain` → nothing, `app` → `domain` + `database`

**Files:**
```text
apps/api/src/target-authorization/
  prisma-authorization-adapter.ts    # Prisma rows → AuthorizationContext
  authorization-http-adapter.ts      # Express handler
  authorization-mapper.ts            # Deny reason → HTTP status + AppError code
  authorization-audit.ts             # Deny-aware audit logging
```

**Audit Logging Requirements:**

Reference `auditLog` middleware (from `apps/api/src/middleware/audit.ts`) only logs when `statusCode < 400`, using fire-and-forget pattern. This means authorization denials are not currently audited.

For Gate 5 probe, adapter MUST log both allow and deny outcomes:

**Required audit fields:**
- `requestId`: correlation ID from request
- `userId`: actor identity ID
- `organizationId`: membership organization (authority, not request selector)
- `warehouseId`: requested warehouse (if present)
- `permission`: requested permission
- `outcome`: `allow` or `deny`
- `denyReason`: specific `AuthorizationDenyReason` if denied (e.g., `WAREHOUSE_ACCESS_DENIED`)
- `timestamp`: ISO 8601 timestamp
- `ipAddress`: from `req.ip`
- `userAgent`: from request headers

**Audit safety rules:**
- Never log tokens, passwords, cookies, session secrets, or cross-tenant data
- Log only the requested `warehouseId`; do not log warehouse IDs user has access to
- Public error response uses specific code (e.g., `WAREHOUSE_ACCESS_DENIED`); `details` remain minimal
- Deny reason logged to audit table but not exposed in public error message beyond code

**Known limitation (documented):**
- Gate 5 probe uses fire-and-forget audit pattern like reference middleware
- Audit write failures do not block authorization response
- Transactional audit (where audit failure causes rollback) is deferred to future operational slice
- Rationale: matches reference behavior; reduces adapter complexity; audit is observability, not enforcement

### Type Adaptation: Prisma → Target

**Prisma Schema Fields (from `packages/database/prisma/schema.prisma`):**
- `User`: `id`, `email`, `isActive`, `emailVerified`, `organizationId`, `role`
- `Organization`: `id`, `isActive`
- `OrganizationMember`: `id`, `organizationId`, `userId`, `role`, `roleId`, `joinedAt`
- `OrganizationMember.assignedRole`: `Role { permissions: RolePermission[] }`
- `OrganizationMemberWarehouse`: `organizationMemberId`, `warehouseId`, `assignedAt`
- `RefreshSession`: `id`, `userId`, `expiresAt`, `revokedAt`
- `Warehouse`: `id`, `organizationId`, `isActive`

**Input (from reference Prisma queries):**
```typescript
// From reference auth middleware (req.user):
// NOTE: req.user does NOT include User.isActive; middleware filters isActive:true then discards flag
req.user: { id, email, name, role, organizationId, organizationSlug, emailVerified }

// Additional Prisma reads required by adapter (reuse existing patterns, no new risky queries):
User (re-query for isActive; do not trust req.user)
OrganizationMember + Organization + assignedRole.permissions
OrganizationMemberWarehouse[]
RefreshSession (defense-in-depth; authMiddleware already validates JWT)
Warehouse (for 404 vs 403 distinction)
```

**Output (target types):**
```typescript
AuthorizationContext {
  identity: IdentityPrincipal
  session: SessionClaim
  membership: OrganizationMembership
}
```

**Field-Level Mapping Table:**

| Target Field | Prisma Source | Fail-Closed Rule |
| --- | --- | --- |
| `identity.identityId` | `User.id` | Required; missing → `MEMBERSHIP_REQUIRED` |
| `identity.status` | `User.isActive` | `true` → `active`, `false` → `inactive`; must re-query, not from `req.user` |
| `identity.emailVerified` | `User.emailVerified` | `true` → verified, `false` → `EMAIL_NOT_VERIFIED` |
| `session.sessionId` | `RefreshSession.id` or synthetic from JWT | Required for audit trail |
| `session.status` | `RefreshSession.revokedAt` | `null` → `active`, non-null → `revoked` |
| `session.expiresAt` | `RefreshSession.expiresAt` (primary) or JWT `exp` (fallback) | Past timestamp → `SESSION_EXPIRED` |
| `membership.membershipId` | `OrganizationMember.id` | Required; missing → `MEMBERSHIP_REQUIRED` |
| `membership.organizationId` | `OrganizationMember.organizationId` | Required; mismatch with request → `ORGANIZATION_MISMATCH` |
| `membership.identityId` | `OrganizationMember.userId` | Required; mismatch with identity → `MEMBERSHIP_IDENTITY_MISMATCH` |
| `membership.status` | `OrganizationMember` exists + `User.isActive` | Both true → `active`, else → `inactive` |
| `membership.organizationStatus` | `Organization.isActive` | `true` → `active`, `false` or missing → `inactive` |
| `membership.role` | `OrganizationMember.role` | Must be in `OrganizationRole` enum; unknown → `UNKNOWN_ROLE` |
| `membership.permissionGrants` | `OrganizationMember.assignedRole.permissions[].permission` | Filter to `Permission` allowlist; unknown values → `UNKNOWN_PERMISSION_GRANT` deny |
| `membership.warehouseScope.kind` | **Always `assigned-warehouses` in Gate 5** | See interim rule below |
| `membership.warehouseScope.warehouseIds` | `OrganizationMemberWarehouse[].warehouseId` where `organizationMemberId` matches | Empty array if no assignments |

**Adapter Safety Rules:**

1. **Identity re-query required:** `req.user` does not carry `User.isActive`. Adapter MUST re-query `User` record by `req.user.id` to obtain `isActive`. Do not trust `req.user` for status.

2. **Session precedence (defense-in-depth):**
   - `RefreshSession.revokedAt` present → `SESSION_REVOKED` (401)
   - JWT invalid/expired → already rejected by `authMiddleware` before adapter runs (401)
   - `RefreshSession.expiresAt` past current time → `SESSION_EXPIRED` (401)
   - `RefreshSession` not found → `SESSION_REVOKED` fail-closed (401)
   - Session checks in adapter are defense-in-depth, not replacement for `authMiddleware` JWT validation

3. **Organization ID precedence:**
   - `OrganizationMember.organizationId` (from membership query) is authority
   - Request body `organizationId` is selector only
   - Mismatch → `ORGANIZATION_MISMATCH` (403)
   - JWT `organizationId` claim not used; membership is sole proof

4. **Warehouse existence check (404 vs 403 distinction):**
   - Query `Warehouse.findFirst({ where: { id: warehouseId, organizationId } })`
   - Not found → 404 `NOT_FOUND` "Warehouse not found" (same as reference `assertWarehouseAccess`)
   - Found but user lacks assignment → 403 `WAREHOUSE_ACCESS_DENIED`
   - Do not leak cross-tenant warehouse existence via 403 vs 404 difference

5. **Email verification edge case:**
   - Reference `authMiddleware` already blocks unverified emails with 403 before adapter runs
   - HTTP integration tests will never exercise `EMAIL_NOT_VERIFIED` target deny reason
   - Unit tests on adapter (with mock data) MUST cover `emailVerified: false` scenario

**Interim Rule for Gate 5: No `organization-wide` Warehouse Scope**

Gate 5 does not implement `organization-wide` warehouse scope grant because:
- No Prisma field, table, or configuration exists to represent "explicit policy" for organization-wide access
- Gate 5 is prohibited from creating migrations or schema changes
- Reference behavior (implicit OWNER/ADMIN global access) conflicts with target fail-closed design

**Gate 5 adapter decision:**
- `membership.warehouseScope.kind` is **always** `assigned-warehouses`
- `membership.warehouseScope.warehouseIds` populated from `OrganizationMemberWarehouse[]`
- Even OWNER/ADMIN roles receive `assigned-warehouses` scope, not `organization-wide`

**Consequence:**
- Parity scenario 6 ("Owner without warehouse assignment") becomes deterministic: target always denies unless explicit assignment exists
- This divergence is **intended security improvement**, not adapter bug
- Future slice (with migration + ADR) may introduce explicit organization-wide grant mechanism

### Fail-Closed Error Mapping

All unknown states, missing data, or validation failures result in denial. No authorization decision defaults to "allow."

| Target Deny Reason | HTTP Status | AppError Code | Details |
| --- | --- | --- | --- |
| `IDENTITY_INACTIVE` | 403 | `FORBIDDEN` | User account inactive |
| `EMAIL_NOT_VERIFIED` | 403 | `FORBIDDEN` | Email verification required |
| `SESSION_REVOKED` | 401 | `UNAUTHENTICATED` | Session revoked |
| `SESSION_EXPIRED` | 401 | `UNAUTHENTICATED` | Session expired |
| `MEMBERSHIP_REQUIRED` | 403 | `FORBIDDEN` | Organization membership required |
| `MEMBERSHIP_INACTIVE` | 403 | `FORBIDDEN` | Membership inactive |
| `ORGANIZATION_INACTIVE` | 403 | `FORBIDDEN` | Organization inactive |
| `ORGANIZATION_MISMATCH` | 403 | `FORBIDDEN` | Organization selector does not match membership |
| `MEMBERSHIP_IDENTITY_MISMATCH` | 403 | `FORBIDDEN` | Identity mismatch |
| `UNKNOWN_ROLE` | 403 | `FORBIDDEN` | Role not recognized |
| `UNKNOWN_PERMISSION_GRANT` | 403 | `FORBIDDEN` | Unknown permission grant detected |
| `UNKNOWN_PERMISSION` | 400 | `VALIDATION_FAILED` | Permission not recognized |
| `PERMISSION_DENIED` | 403 | `FORBIDDEN` | Insufficient permissions |
| `WAREHOUSE_SCOPE_REQUIRED` | 403 | `FORBIDDEN` | Warehouse access required but no assignments exist |
| `WAREHOUSE_ACCESS_DENIED` | 403 | `FORBIDDEN` | No access to requested warehouse |

**Safety rules:**
- `details` contains only non-sensitive, in-scope data (never passwords, tokens, cross-tenant IDs)
- Audit log records deny reasons without exposing them in public error messages
- Unknown states fail closed rather than allowing access

### Parity Test Matrix

Six scenarios executed against **disposable local PostgreSQL only** (never Neon, never production):

| # | Scenario | Reference Expectation | Target Expectation | Test Pattern |
| --- | --- | --- | --- | --- |
| 1 | Same tenant, assigned warehouse, valid permission | Allow | Allow | `expectParity()` |
| 2 | Cross-tenant organization selector | Deny 403 | Deny `ORGANIZATION_MISMATCH` 403 | `expectParity()` |
| 3 | Unassigned warehouse | Deny 403 | Deny `WAREHOUSE_ACCESS_DENIED` 403 | `expectParity()` |
| 4 | Inactive membership | Deny 403 | Deny `MEMBERSHIP_INACTIVE` 403 | `expectParity()` |
| 5 | Unknown permission (not in allowlist) | **May allow** (custom role) | Deny `UNKNOWN_PERMISSION` 400 | `expectDivergence()` |
| 6 | Owner without warehouse assignment | **May allow** (implicit global) | Deny `WAREHOUSE_SCOPE_REQUIRED` 403 | `expectDivergence()` |

**Test Helpers (explicit divergence tracking):**

```typescript
function expectParity(scenario: {
  name: string;
  reference: { allowed: boolean; status?: number };
  target: { allowed: boolean; status?: number; reason?: string };
}) {
  // Assert reference matches expected
  // Assert target matches expected
  // Assert outcomes are equivalent (both allow or both deny with similar status)
  // Fail if either deviates from documented expectation
}

function expectDivergence(scenario: {
  name: string;
  reference: { allowed: boolean; status?: number };
  target: { allowed: boolean; status?: number; reason: string };
  justification: string;
}) {
  // Assert reference matches expected (e.g., may allow)
  // Assert target matches expected (e.g., deny with specific reason)
  // Assert divergence is documented and intentional
  // Fail if reference starts denying (convergence) without ADR update
  // Fail if target starts allowing (regression)
  // Fail if deny reason changes without mapping table update
}
```

**Scenarios 5 and 6 are intentional security improvements:**
- **Scenario 5:** Reference runtime allows custom roles with arbitrary permission strings; target requires finite permission allowlist. Divergence justified by preventing privilege escalation via unknown permissions.
- **Scenario 6:** Reference runtime grants implicit warehouse-wide access to OWNER/ADMIN (via `GLOBAL_ROLES` set in `warehouseScope.ts`); target requires explicit `assigned-warehouses` scope in Gate 5 interim rule. Divergence justified by fail-closed warehouse access and explicit grant requirement.

Test failures:
- If reference behavior changes (e.g., starts denying scenario 5) → update ADR and migrate to `expectParity()`
- If target behavior regresses (e.g., starts allowing scenario 5) → implementation bug
- If deny reason changes → update mapping table in ADR

These divergences are **accepted and documented**. They represent the desired target behavior and will replace reference behavior in future operational slices.

### Rollback Procedure

**Activation:**
1. Set `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true` in Render API environment (not Vercel)
2. Restart API service
3. Route becomes available at `POST /api/v1/_parity/authorization/check`

**Rollback:**
1. Set `ENABLE_TARGET_AUTHORIZATION_ADAPTER=false`
2. Restart API service → route no longer registered, falls through to 404
3. Delete `apps/api/src/target-authorization/` directory
4. Remove route registration line from `apps/api/src/app.ts`

**Rollback safety:**
- No schema changes required
- No migrations to reverse
- No data cleanup required (read-only operation)
- No deployment configuration changes beyond environment variable
- Reference routes remain untouched and fully operational

**Rollback evidence:**
- Integration test proves 404 after flag set to `false`
- Documentation shows adapter deletion does not break existing routes
- Baseline quality gates pass after rollback

### Integration Test Requirements

**Disposable PostgreSQL setup:**
- Use `docker-compose.dev.yml` PostgreSQL service as host
- Create unique database per test run (e.g., `stokku_test_<timestamp>`)
- Run `prisma migrate deploy` against disposable database
- Insert test fixtures (users, organizations, memberships, warehouse assignments)
- Run parity tests
- Drop database after test completion

**Safety guards:**
- Fail-fast if `DATABASE_URL` contains `neon.tech` or `amazonaws.com` or production identifiers
- Fail-fast if `NODE_ENV === 'production'`
- Fail-fast if `DIRECT_URL` points to non-local host
- Never run against Neon or production databases

**Known drift (not blocking, document only):**
- `docker-compose.dev.yml` uses `node:18-alpine` while root `package.json` specifies `engines.node: 22.x`
- Do not change Compose image in Gate 5; document drift for future cleanup

## Consequences

### Positive
- Measurable parity evidence before production commitment
- Clean rollback without migrations or data cleanup
- Quantified divergences that improve security posture
- Proof of concept for future operational adapter slices
- Isolated risk: failure does not affect reference routes

### Negative
- Temporary dual-path maintenance (reference + target adapters)
- Extra non-public route during transition period
- Development cost for adapter and parity tests

### Neutral
- Target packages remain inactive in production routes until future Gate approval
- Reference middleware remains authoritative for all operational workflows
- Feature flag must be managed in deployment environment

### Mitigations
- Route excluded from public API documentation to prevent external dependency
- Feature flag default `false` ensures opt-in activation
- Parity tests run in CI to detect regressions in either path
- ADR and rollback evidence reduce risk of stranded code

## Verification

Gate 5 acceptance requires:

- [ ] ADR-0017 approved
- [ ] `ENABLE_TARGET_AUTHORIZATION_ADAPTER` added to `apps/api/src/config/index.ts` with validation
- [ ] `POST /api/v1/_parity/authorization/check` route implemented with feature flag
- [ ] Prisma → `AuthorizationContext` adapter with field-level mapping table
- [ ] HTTP adapter with `AppError` envelope and deny-aware audit
- [ ] `expectParity()` and `expectDivergence()` test helpers implemented
- [ ] 6 parity scenarios passing on disposable PostgreSQL:
  - Scenarios 1-4 use `expectParity()` and assert equivalent outcomes
  - Scenarios 5-6 use `expectDivergence()` and assert documented divergence with justification
- [ ] Warehouse not found returns 404 `NOT_FOUND`, not 403 (matches reference `assertWarehouseAccess`)
- [ ] Cross-tenant warehouse access does not leak existence via 403 vs 404 difference
- [ ] Unit tests cover `emailVerified: false` scenario (not reachable via HTTP due to authMiddleware)
- [ ] Integration test guards: fail-fast if `DATABASE_URL` contains production identifiers or `NODE_ENV=production`
- [ ] Rollback procedure tested: flag `false` → route returns 404
- [ ] Baseline quality gates pass (lint, typecheck, test, build, docs:check, prisma validate)
- [ ] No changes to reference routes, auth middleware, Prisma schema, or migrations
- [ ] No changes to `apps/api/src/middleware/auth.ts`, `rbac.ts`, `warehouseScope.ts`, or `modules/auth/**`
- [ ] Production status remains NO-GO until blockers resolved

## Related Work

- ADR-0016: Target Architecture Transition (establishes incremental slice approach)
- ADR-0003: Tenant and Warehouse Authorization (reference authorization requirements)
- Gate 4: Identity and Authorization Target Boundaries (domain package foundation)
- `docs/gate-4-identity-authorization-boundaries.md`: Target boundary specification
- `docs/Security.md`: Threat model and fail-closed authorization requirements
