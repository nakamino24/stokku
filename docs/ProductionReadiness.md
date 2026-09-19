# Production Readiness Checklist

**Current decision:** NO-GO
**Owner:** Engineering and operations

## Security and Identity

- [ ] Exposed Vercel OIDC credential revoked and all related credentials rotated; legacy Vercel server secrets have been removed
- [ ] Git history, provider logs, build logs, CI logs, and local artifacts reviewed
- [ ] Supported framework and dependency versions deployed; no critical advisories and high findings have documented owners
- [x] Argon2id password hashing implemented for registration, password change, and reset flows
- [ ] Opportunistic bcrypt-to-Argon2id migration completed and legacy dependency removed
- [x] Server-side refresh sessions rotate, detect reuse, and support logout-all
- [x] Production email provider integration and required configuration validation implemented
- [ ] Configure and verify the Resend sender domain and provider secret in Render
- [x] Neon production schema migrated through `20260913002000_append_only_audit`; demo tenant data removed
- [ ] Hosted API environment is configured with the Neon runtime and migration URLs, then passes a post-deploy health check
- [ ] Render has `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `CORS_ORIGINS`, `ACCESS_TOKEN_SECRET`, and `EMAIL_OUTBOX_ENCRYPTION_KEY`; the current hosted API returns `500` for login because it is not fully configured
- [x] Transactional email outbox persistence, encrypted payloads, and bounded retry worker implemented
- [ ] Move outbox processing to a dedicated worker before multi-replica deployment
- [ ] Production email verification provider is configured and verification is enforced before warehouse access
- [ ] Password reset is single-use, expiring, hashed, and session-revoking
- [ ] OAuth state and PKCE are tested
- [ ] Refresh rotation, reuse detection, logout, and session revocation are tested
- [ ] Tenant and warehouse isolation integration tests pass against disposable PostgreSQL
- [x] API PostgreSQL integration tests pass against a local disposable PostgreSQL instance
- [x] Owner/admin escalation and cross-tenant authorization tests pass at the service boundary
- [ ] API responses and logs contain no password/token/session secrets
- [ ] CSP, security headers, CORS, origin/CSRF checks, request limits, and rate limits are active

## Inventory Correctness

- [x] Ledger and audit tables reject update/delete mutations through PostgreSQL triggers
- [ ] Production runtime database role cannot bypass append-only triggers; migration role is separate
- [ ] Balance projection reconciles exactly from ledger
- [x] Purchase-order receiving warehouse ownership is approved and implemented before any warehouse-scoped receiving queue is enabled
- [x] Purchase-order planned warehouse schema uses tenant-safe composite relation and verified migration before Gate 7A implementation
- [x] Planned warehouse schema implementation ADR is approved before schema or migration coding starts
- [x] Gate 7A receiving queue has separate implementation approval and verification for internal read-only scope
- [ ] Gate 7A receiving queue remains disabled in production and has not received production enablement approval
- [ ] Gate 7B receiving draft workflow has approved schema, idempotency, authorization, audit, and retry design before implementation
- [ ] Gate 7B receiving draft exact schema and migration SQL are approved before implementation
- [ ] Purchase-order planned-warehouse authoring contract, purchasing authority, approval invalidation, idempotency, concurrency, and audit behavior are approved and implemented before Gate 7B receiving drafts
- [ ] Target inbound authorization policy provides independently revocable memberships, finite grants, explicit active warehouse scope, legacy-grant remediation, separation-of-duties, and transactional authorization-change audit before Gate 7B receiving drafts
- [ ] Receiving draft persistence proposal provides composite tenant-safe FKs quantity and reason checks partial active-draft index idempotency claims and optimistic concurrency with empty plus existing-data migration verification before Gate 7B receiving drafts
- [ ] Receiving draft API contract proposal provides strict schemas allowlisted DTOs explicit errors idempotency headers and internal pagination with contract verification before Gate 7B receiving drafts
- [ ] Receiving draft slice plan provides entry criteria file scope transaction template test gates and rollback with focused plus full-suite verification before Gate 7B receiving drafts
- [ ] Inbound allowlist and error alignment provides exact permission delta disjoint role bundles and owned 401 and OVER_RECEIPT codes with domain verification before Gate 7B receiving drafts
- [ ] Draft slice security and production-impact review plan provides threat mapping checklist evidence and flag-off impact bar with sign-off before Gate 7B receiving drafts
- [ ] Receiving posting and ledger boundary planning provides synchronous atomic posting warehouse equality creator-may-not-post and reversal-only correction design before any posting implementation
- [ ] Gate 7B approval gate provides two-phase per-ADR sign-off evidence bundle and expiry with recorded status transitions before any draft implementation
- [ ] Canonical promotion planning provides dual-serve deprecation keyset codes OpenAPI and telemetry design before any canonical draft route
- [ ] Receiving workflow boundary, approval policy, idempotency storage, and retry behavior are approved before receiving mutation implementation
- [ ] Receipt posting is exactly once and retry-safe
- [ ] Putaway does not duplicate receipt quantity
- [ ] Allocation reserves exact quantities under concurrency
- [ ] Shipment deducts physical stock exactly once
- [ ] Reversal and short-pick policies are explicit and tested
- [ ] Cycle count and adjustment approval are auditable

## Operations

- [ ] Separate local, preview, staging, pilot, and production environments
- [ ] `NODE_ENV=production` and startup configuration validation are verified
- [ ] Deployments are immutable and traceable to commit SHA
- [ ] Health/readiness checks and monitoring are active
- [ ] Database connection limits and latency are measured
- [ ] Automated backups are enabled and verified
- [ ] Restore drill meets RPO/RTO targets
- [ ] Rollback drill is complete
- [ ] Incident, credential rotation, reconciliation, and failed migration runbooks exist

## User Experience

- [ ] Receiving and putaway work on a tablet without desktop-only steps
- [ ] Picking, packing, and shipment workflows work on supported mobile viewports
- [ ] Barcode keyboard-wedge flow is tested
- [ ] Loading, empty, error, denied, retry, and slow-network states are present
- [ ] WCAG 2.2 AA audit passes for critical workflows

## Release Gate

Any unchecked P0 item blocks controlled production use unless an explicit exception
records the risk, compensating control, owner, expiry date, and rollback plan.
