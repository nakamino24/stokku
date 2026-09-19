# Deployment Strategy

**Status:** Phase 0 proposed baseline

## 1. Profiles

| Profile    | Purpose                                      | Topology                             | Reliability posture                      |
| ---------- | -------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| Local      | Development and disposable integration tests | Docker PostgreSQL, local web/API     | No production data                       |
| Preview    | PR review and contract/E2E checks            | Ephemeral web/API plus disposable DB | Data is disposable                       |
| Pilot      | Controlled warehouse use                     | Vercel -> Render -> Neon             | Measured limits; no public SLA           |
| Production | Public SaaS launch                           | Approved paid/reliable equivalents   | SLO, backups, restore, rollback required |

The current free-tier Vercel/Render/Neon topology is acceptable for local,
preview, and controlled pilot use only. Render sleep, provider quotas, connection
limits, and Neon storage limits are documented limitations, not hidden incidents.

## 2. Environment Separation

The web deployment receives only public configuration and server-only API origin.
The API receives database, signing, OAuth, email, and integration secrets. Database
and JWT/session secrets must never be configured in Vercel or exposed through
`NEXT_PUBLIC_*` variables.

Required API production variables include `NODE_ENV=production`, `DATABASE_URL`,
`DIRECT_URL`, session/auth secrets, exact HTTPS `CORS_ORIGINS`, HTTPS `APP_URL`,
email-provider values, and log configuration. Values are validated at startup and
the process fails closed when required secrets are missing or weak.

## 3. Release Pipeline

1. Pull request runs formatting, lint, typecheck, unit, integration, E2E, migration,
   secret, dependency, container, and accessibility checks.
2. Build artifacts are associated with a commit SHA and dependency lockfile.
3. Preview deploy uses a disposable database branch or database and runs smoke tests.
4. Production migration is reviewed and applied with expand/contract sequencing.
5. API deploy starts the immutable image or source artifact identified by SHA.
6. Non-destructive health, authentication, and read-only route smoke tests run before
   traffic is considered healthy.
7. Deployment records commit SHA, migration version, actor, time, and result.

The current API starts one bounded email-outbox poller per process. Do not scale the
API horizontally with this in-process worker until processing is split into a
dedicated worker deployment or a provider-backed queue. The provider request uses
the outbox message ID as its idempotency key to reduce duplicate delivery risk.

Database deployment uses a migration role separate from the API runtime role. The
runtime role must have only the required DML permissions and must not own
`StockMovement` or `AuditLog`, use `BYPASSRLS`, or hold superuser privileges.

## 4. Rollback

Application rollback deploys the last known-good SHA when the database contract is
backward compatible. A migration is not destructively rolled back in production.
If data correctness is at risk, stop mutations, preserve evidence, restore into an
isolated database, reconcile from the ledger, and execute the incident runbook.

## 5. Secrets and Credentials

- Revoke the exposed Vercel OIDC credential and rotate affected deployment,
  database, session, OAuth, and integration credentials before any production use.
- Review Git history, build logs, CI logs, local artifacts, and provider audit logs.
- Store secrets in provider secret stores or GitHub environment secrets, never in
  tracked files, browser bundles, Docker layers, or logs.
- Rotation is tested as an operational procedure, not deferred until an incident.
