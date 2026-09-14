# Gate 5: Authorization Adapter Parity Probe

**Status:** Implemented, feature-flagged, inactive by default
**ADR:** `adr/0017-authorization-adapter-parity.md`
**Runtime effect:** None unless `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true`. Reference
routes, auth middleware, schema, and migrations are untouched.

## Purpose

Gate 5 adapts the target identity/authorization boundary (Gate 4 packages) to the
reference persistence and HTTP layers as an isolated, read-only parity probe. It
proves that reference Prisma rows can power target authorization decisions, and it
documents the two places where the target is intentionally stricter than the
reference before any operational route adopts the target.

## Scope

- Single slice: warehouse-scoped inventory read authorization check
- Read-only: no data mutation, no role/session changes
- New files only: adapter lives in `apps/api/src/target-authorization/`
- No changes to reference routes, middleware, schema, or migrations
- Probe active only when `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true`

## Files

| File | Responsibility |
| --- | --- |
| `apps/api/src/target-authorization/prisma-authorization-adapter.ts` | Prisma rows → target `AuthorizationContext` |
| `apps/api/src/target-authorization/authorization-http-adapter.ts` | Express handler for the probe route |
| `apps/api/src/target-authorization/authorization-mapper.ts` | Target deny reason → HTTP status + AppError code |
| `apps/api/src/target-authorization/authorization-audit.ts` | Deny-aware audit logging (fire-and-forget) |
| `apps/api/src/target-authorization/parity-helpers.ts` | `expectParity()` and `expectDivergence()` assertions |
| `apps/api/src/target-authorization/*.test.ts` | Unit + integration parity tests |

## Route

`POST /api/v1/_parity/authorization/check`

- Mounted only if `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true`
- Reuses reference `apiLimiter` and reference `authMiddleware`
- Not part of the public API (`docs/API.md`) surface
- Not a stable contract: prefixed `_parity`, removed before any canonical Hono route

Request:

```json
{ "organizationId": "uuid", "warehouseId": "uuid", "permission": "inventory.read" }
```

Responses use the existing `AppError` envelope from `middleware/errorHandler.ts`:

```json
{ "error": { "code": "...", "message": "...", "requestId": "...", "details": {} } }
```

## Adapter Rules (ADR-0017)

1. `User.isActive` is re-queried; `req.user` does not carry it and is not trusted
   for status.
2. Session checks are defense-in-depth: JWT is enforced by `authMiddleware` first;
   the adapter only verifies `RefreshSession.revokedAt` / `expiresAt`.
3. Membership is the sole organization authority. A request `organizationId` is a
   selector only; mismatch → `ORGANIZATION_MISMATCH`.
4. Warehouse not found / cross-tenant warehouse → 404 `NOT_FOUND` (matches reference
   `assertWarehouseAccess`). No 403/404 asymmetry that would leak warehouse existence.
5. Gate 5 interim rule: `warehouseScope.kind` is always `assigned-warehouses`. No
   `organization-wide` grant exists yet; even `OWNER`/`ADMIN` require assignments.
6. Unknown permission grants are filtered to the target allowlist at the adapter.
   The domain's `UNKNOWN_PERMISSION_GRANT` remains as defense-in-depth.
7. `EMAIL_NOT_VERIFIED` cannot be reached through HTTP (`authMiddleware` blocks it),
   so it is covered by adapter unit tests, not integration tests.

## Feature Flag

`ENABLE_TARGET_AUTHORIZATION_ADAPTER` (default: `false`)

- Server-only; never exposed to `NEXT_PUBLIC_*`
- Read in `apps/api/src/config/index.ts` under `config.features`
- Route registration in `apps/api/src/app.ts` is conditional
- Warns at startup if enabled in production

## Parity Matrix

| # | Scenario | Reference | Target | Result |
| --- | --- | --- | --- | --- |
| 1 | Same tenant, assigned warehouse, valid permission | Allow 200 | Allow 200 | `expectParity()` passes |
| 2 | Cross-tenant organization selector | Deny 403 | Deny 403 | `expectParity()` passes |
| 3 | Unassigned warehouse | Deny 403 | Deny 403 | `expectParity()` passes |
| 4 | Inactive membership | Deny 403 | Deny 403 | `expectParity()` passes |
| 5 | Unknown permission | Allow (wildcard custom role) | Deny `UNKNOWN_PERMISSION` 400 | `expectDivergence()` documented |
| 6 | Owner without warehouse assignment | Allow (implicit organization-wide) | Deny `WAREHOUSE_SCOPE_REQUIRED` 403 | `expectDivergence()` documented |

Scenarios 5 and 6 are intentional security improvements, asserted with
`expectDivergence()` so any convergence or deny-reason drift fails CI.

## Rollback Procedure

Activation:
1. Set `ENABLE_TARGET_AUTHORIZATION_ADAPTER=true` in the API environment.
2. Restart the API service.
3. Probe route becomes available.

Rollback:
1. Set `ENABLE_TARGET_AUTHORIZATION_ADAPTER=false`.
2. Restart the API service.
3. Route is no longer registered: requests return the existing 404 catch-all
   (`app.use('*', ...)` in `apps/api/src/app.ts`). Proven by
   `route-disabled.test.ts` (`POST /api/v1/_parity/authorization/check` → 404).
4. Delete `apps/api/src/target-authorization/` and the two lines in `app.ts`
   (import + conditional block). No other file references the adapter.

Rollback guarantees:
- No schema change, migration, or migration ordering change.
- No data cleanup (the probe is read-only except audit rows scoped to probe calls).
- No deployment/topping/config change beyond the environment variable.
- Reference routes and modules are untouched and continue to run as before.

## Verification

- Unit tests (31): adapter mapping, mapper table, HTTP envelope, parity helpers,
  route mount/rollback evidence.
- Integration parity tests (6 scenarios) run only against disposable PostgreSQL
  (`RUN_DATABASE_INTEGRATION_TESTS=true` + `localhost` URL). Guard refuses Neon,
  AWS RDS, and `NODE_ENV=production`.
- Full API suite against disposable PostgreSQL: 32 suites, 156 tests.

## Known Limitations (documented)

- Probe audit is fire-and-forget, matching the reference `audit.ts` pattern.
  Transactional audit is deferred to a future slice.
- Adapter files may be deleted in a later gate once operational routes adopt the
  target; dependency-boundary tests keep target packages out of `apps/web`.
- `docker-compose.dev.yml` still pins `node:18-alpine` while the repository
  requires Node 22. Recorded, not changed in this gate.