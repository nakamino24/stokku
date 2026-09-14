# Security Baseline and Threat Model

**Status:** Release baseline; implementation incomplete
**Release posture:** NO-GO until all P0 blockers are closed or explicitly
accepted by an accountable owner with compensating controls.

**Document boundary:** sections 1 through 5 define target security requirements.
The current-state sections record evidence and blockers in the disposable reference
implementation; they are not evidence that the target architecture is complete.

## 1. Security Objective

The objective is not an unrealistic guarantee of “100% security.” The launch bar
is no known critical vulnerability, explicit threat modeling, strong tenant and
permission isolation, secure-by-default authentication, immutable inventory history,
automated security checks, monitored behavior, and a practiced incident response.

## 2. Assets

- Inventory quantities, costs, valuations, lots, serials, and movement history.
- Organization membership, role assignments, warehouse scopes, and audit records.
- Password hashes, sessions, reset/verification credentials, OAuth state, and API keys.
- Supplier, customer, employee, shipping, and operational data.
- Database credentials, deployment credentials, signing keys, backups, and logs.

## 3. Trust Boundaries

```text
Browser / scanner
        |
        | TLS, cookie/session, CSRF/origin checks
        v
Vercel web runtime ---- HTTPS ---- Render API
                                      |
                                      | private credentials, validated commands
                                      v
                               Neon PostgreSQL
                                      |
                                      +--> worker / email / webhook providers
```

The browser is untrusted. Request headers, organization IDs, role claims, barcode
values, quantities, and document IDs are all attacker-controlled until validated
and authorized by the API.

## 4. Threat Register

| ID   | Threat                                | Impact                                 | Required control                                                                 | Gate |
| ---- | ------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| T-01 | Cross-tenant object access            | Critical data exposure or mutation     | Membership lookup plus tenant-scoped repository predicates and integration tests | P0   |
| T-02 | Horizontal warehouse access           | Wrong-site stock movement              | Warehouse scope on every task and mutation                                       | P0   |
| T-03 | Role escalation to owner/admin        | Full tenant compromise                 | Authority ordering, owner invariants, no self-promotion, escalation tests        | P0   |
| T-04 | Stolen refresh credential             | Account takeover                       | HttpOnly cookie, rotation, reuse detection, revocation, generic errors           | P0   |
| T-05 | Unverified or reset-account abuse     | Unauthorized access                    | Single-use hashed tokens, expiry, verified-account policy, rate limits           | P0   |
| T-06 | Duplicate receipt/shipment retry      | Inventory corruption                   | Transactional idempotency record and command tests                               | P0   |
| T-07 | Concurrent allocation race            | Overselling or negative stock          | Row locks/serializable transaction, invariant checks, concurrency tests          | P0   |
| T-08 | ORM entity data leakage               | Password/token/PII exposure            | Explicit response DTOs and response contract tests                               | P0   |
| T-09 | CSRF through refresh cookie           | Unauthorized browser mutation          | SameSite policy, origin checks, CSRF token where required                        | P0   |
| T-10 | SQL or filter injection               | Data access or denial of service       | Parameterized queries, bounded filters, schema validation                        | P0   |
| T-11 | CSV formula injection                 | Spreadsheet code execution             | Escape cells beginning with `=`, `+`, `-`, `@`; export tests                     | P1   |
| T-12 | SSRF through integrations             | Internal network exposure              | Provider allowlist, URL validation, no arbitrary fetch                           | P1   |
| T-13 | Secret exposure in CI/build/logs      | Credential compromise                  | Secret scanning, redaction, environment separation, rotation runbook             | P0   |
| T-14 | Audit tampering or broad audit access | Loss of accountability or PII exposure | Append-only writes, restricted queries, integrity checks, export audit           | P1   |
| T-15 | Dependency or container exploit       | Runtime compromise                     | Lockfile audit, patched framework, SAST, DAST, container scan                    | P0   |

## 5. Current Release Blockers

The following are confirmed in the reference implementation:

- The web application no longer uses `next@13.4.0`; it is upgraded to the
  supported Next 15.5 line and the production build passes. `pnpm audit` now
  reports zero critical issues, but ten high findings remain in transitive tooling
  and provider/runtime review is still required before production.
- Registration now creates an unverified account and refuses login or protected
  access until verification. Development uses a local-only sender; production
  delivery is queued through the configured provider and still requires sender
  domain verification before release.
- Google OAuth is not implemented.
- Authentication now hashes new and changed passwords with Argon2id. Legacy bcrypt
  hashes are supported only for opportunistic login rehashing and remain a migration
  dependency until the stored-hash inventory reaches zero.
- Refresh credentials are opaque, hashed at rest, HttpOnly cookie-bound, rotated in
  a transaction, and family-revoked on replay. Password changes and `logout-all`
  revoke all active refresh sessions.
- Verification and reset links are delivered through a server-only Resend provider
  boundary. Production fails closed without `RESEND_API_KEY` and `EMAIL_FROM`; raw
  links are never written to production logs.
- Verification and reset email intent is persisted in the transactional outbox;
  delivery retries are bounded and stale worker claims are recoverable. Message
  bodies containing one-time links are encrypted at rest and must remain excluded
  from operational APIs/logs.
- PostgreSQL rejects updates and deletes against inventory ledger and audit rows;
  production role grants must additionally prevent trigger bypass and table ownership
  by the runtime role.
- Owner/admin role escalation, custom-role permission ceilings, system-role protection,
  and cross-organization warehouse assignment boundaries have dedicated regression
  coverage.
- Warehouse scope is now modeled as an explicit membership-to-warehouse relation.
  Existing memberships are backfilled to all current warehouses, while OWNER and
  ADMIN retain organization-wide authority and other users are filtered to explicit
  assignments. Horizontal isolation still requires disposable PostgreSQL integration
  coverage before release.
- User deactivation now uses an explicit safe response selection and requires
  higher-authority actor membership.
- Helmet CSP is enabled with an explicit API policy.
- `render.yaml` now sets `NODE_ENV=production`; the deployed service still requires
  provider-dashboard verification.
- The API now sets `NODE_ENV=production` in the Render blueprint, but an already
  deployed service must be verified in the provider dashboard and redeployed.
- Vercel build configuration contains only the Prisma postinstall toggle; backend
  database and signing secrets are not required by the web build. Provider
  environment settings still require a manual review to remove any legacy secret.
- Local environment material and Vercel metadata are present on disk. They are
  ignored by Git, but any exposed Vercel OIDC credential must be revoked and rotated
  outside the repository. Git history, build logs, CI logs, and local artifacts
  require a secret review.
- Audit writes are asynchronous and best-effort rather than part of the mutation
  transaction. Database triggers enforce append-only rows, but audit entries are
  not hash chained and the runtime role still needs restricted production grants.
- API errors now use the nested request-ID error contract. Warehouse scope is applied
  to warehouse, stock, inventory, dashboard, reports, receiving, and sales-order
  operations. Role mutation and user deactivation now enforce actor authority.

## 6. Required CI Security Checks

- Secret scanning with Gitleaks or equivalent.
- `pnpm audit --audit-level high` with documented, time-bound exceptions only.
- CodeQL or equivalent SAST.
- Dependency lockfile and license review.
- Trivy filesystem/container scan for deployable images.
- OWASP ZAP DAST against a disposable staging deployment.
- Authorization integration tests for horizontal and vertical escalation.
- Contract tests proving sensitive fields never appear in responses or logs.

## 7. Incident Response Minimum

1. Revoke affected credentials and freeze deployments.
2. Identify impacted organizations, users, sessions, and inventory commands.
3. Preserve redacted logs and audit evidence without exposing secrets.
4. Rotate signing, database, OAuth, deployment, and integration credentials as
   applicable.
5. Restore or reconcile inventory from the immutable ledger if physical effects are
   in question.
6. Notify affected customers and regulators according to the incident policy.
7. Record root cause, containment, recovery, and preventive work in a post-incident
   review.
