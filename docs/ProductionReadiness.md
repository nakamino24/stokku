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
