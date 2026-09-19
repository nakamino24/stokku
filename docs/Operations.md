# Operations and Recovery

**Status:** Phase 0 proposed baseline

**Document boundary:** operating targets are target requirements. Notes about the
current in-process outbox or deployed stack are reference-runtime evidence only.

## 1. Health and Observability

- `/health` is a liveness check and does not disclose database details publicly.
- `/ready` verifies required dependencies and returns failure when the API cannot
  safely accept traffic.
- Logs are structured JSON with request ID, command, tenant, actor, status, and
  duration. Sensitive fields are redacted before serialization.
- Alerts cover sustained API 5xx, authentication failures, authorization denials,
  inventory posting failures, serialization retries, queue age, database saturation,
  and reconciliation discrepancies.
- The API email outbox worker is single-process only in the current deployment. Monitor
  pending/failed message counts, oldest pending age, and provider rejection rate. A
  sustained backlog or any terminal `FAILED` messages requires operator review.

## 2. Pilot Service Objectives

These are operating targets, not claims about free-tier provider availability:

| Signal                      | Target                                                         |
| --------------------------- | -------------------------------------------------------------- |
| Read API p95                | Under 300 ms in the pilot load profile                         |
| Command API p95             | Under 500 ms excluding external delivery                       |
| Critical command error rate | Less than 0.1% excluding invalid operator input                |
| Recovery point              | Under 1 hour after production profile is funded and configured |
| Recovery time               | Under 4 hours after a tested restore procedure                 |
| Reconciliation              | No unexplained ledger/projection discrepancy                   |

Targets must be measured in staging and pilot; a documentation value is not proof.

## 3. Backup and Restore

- Enable provider backups and retain encrypted logical exports according to the
  production data-retention policy.
- Run a scheduled backup verification that checks object existence and age without
  logging connection strings.
- Perform a restore drill before launch and at least quarterly afterward.
- Restore into an isolated database, run migrations, run reconciliation, and verify
  representative tenant and authorization queries.
- Record RPO, RTO, operator, commit SHA, database version, and discrepancies.

## 4. Incident Response

1. Declare severity and assign an incident commander.
2. Contain: freeze deploys or mutations, revoke credentials, and isolate affected
   tenants or endpoints.
3. Preserve request IDs, redacted logs, audit events, ledger entries, and provider
   evidence.
4. Assess data, identity, inventory, and regulatory impact.
5. Recover through a tested rollback, restore, or compensating ledger command.
6. Communicate with affected stakeholders according to the incident policy.
7. Complete a blameless review with root cause, timeline, and preventive actions.

## 5. Runbooks

The implementation phase must add executable runbooks for:

- credential rotation
- failed migration
- application rollback
- database restore
- inventory reconciliation discrepancy
- stuck outbox or export job
- authentication incident
- cross-tenant authorization incident
