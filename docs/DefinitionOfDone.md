# Definition of Done

**Status:** Phase 0 proposed baseline

A feature is done only when all applicable requirements are implemented, tested,
documented, and reviewed.

- Product requirement and acceptance criteria are linked.
- Domain rule is implemented outside HTTP/UI code.
- Authorization checks tenant and warehouse scope.
- Input and output contracts are validated and sensitive fields are excluded.
- Mutations use transaction and idempotency semantics where retryable.
- Posted inventory history remains immutable and reversals are compensating entries.
- Unit, integration, contract, and E2E coverage matches the risk of the feature.
- Loading, empty, error, denied, slow-network, and accessibility states are usable.
- Structured logs, request IDs, metrics, and alerts exist for critical paths.
- Migration, seed, rollback, and operational notes are documented.
- Security, performance, accessibility, and UX reviews are complete.
- CI is green and the deployment artifact is traceable to a commit SHA.

## Controlled Pilot Exit

The first warehouse pilot may begin only when authentication, tenant and warehouse
authorization, receiving, putaway, allocation, pick, pack, shipment, reconciliation,
and recovery gates in `ProductionReadiness.md` are green.
