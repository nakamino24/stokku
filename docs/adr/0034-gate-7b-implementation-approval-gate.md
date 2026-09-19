# ADR-0034: Gate 7B Implementation Approval Gate

## Status

Proposed for review; implementation not approved

## Date

2026-09-19

## Owners

CTO, Principal Engineering, Product, Security, Backend, Database Architecture, QA, DevOps

## Related ADRs

- ADR-0016: Target Architecture Transition
- ADR-0019: Receiving Workflow Boundary
- ADR-0024: Receiving Draft Workflow
- ADR-0025: Receiving Draft Schema And Idempotency Design
- ADR-0026: Purchase-Order Planned Warehouse Authoring
- ADR-0027: Target Authorization Policy For Inbound Commands
- ADR-0028: Receiving Draft Persistence Implementation Proposal
- ADR-0029: Receiving Draft API Contract Proposal
- ADR-0030: Receiving Draft Implementation Slice And Rollout Plan
- ADR-0031: Inbound Permission Allowlist And Error-Code Alignment
- ADR-0032: Draft Slice Security And Production-Impact Review Plan
- ADR-0033: Receiving Posting And Ledger Boundary Planning

## Problem

Eight prerequisite proposals now cover the Gate 7B draft slice end to end
(ADR-0026 through ADR-0033), and every one of them is still
Proposed for review; implementation not approved. No single rule defines what
flips a proposal to Approved, who must sign, what evidence is required, or what
an approval actually authorizes. Without that gate definition, three failure
modes are likely:

- Partial silent approval: one reviewer comments approval on one ADR and
  implementation starts while sibling prerequisites are still unreviewed.
- Scope creep at approval time: an approval comment is read as authorizing
  code, migrations, flags, or production enablement it never named.
- Stale approval: a proposal approved months ago is implemented after its
  parents changed, without re-review.

The gate document repeats per-ADR blocker bullets but has no decision rule.
Production readiness lists proposal checkboxes but no sign-off bar. This ADR
closes that meta-gap. It authorizes no design change, no code, and no
production change.

## Context

What exists today:

- ADR-0024 and ADR-0025 are approved planning baselines; they do not authorize
  implementation.
- ADR-0026 through ADR-0033 are proposals; none authorizes implementation.
- Gate 7A precedent: ADR-0022 proposed exact schema and SQL, received separate
  implementation approval, then recorded verification evidence in the ADR
  before Gate 7A was considered complete. ADR-0023 did the same for the queue
  route with its own flag, scope, tests, and rollback evidence.
- `docs/DefinitionOfDone.md` requires implemented, tested, documented, and
  reviewed completion with green CI and a traceable SHA.
- Production posture is NO-GO and stays NO-GO under every ADR in this chain.

## Alternatives

### Alternative 1: Approve each ADR independently whenever a reviewer comments

Pros:

- Fastest path to coding.

Cons:

- No ordering: draft routes could be approved before persistence or
  authorization storage.
- No evidence standard: one approval means text review, another means
  test execution.
- No expiry: stale approvals silently survive parent changes.

Decision:

- Rejected.

### Alternative 2: Single big-bang approval of all eight prerequisites at once

Pros:

- One review meeting, one decision.

Cons:

- Forces reviewers to hold authoring, authorization storage, persistence SQL,
  HTTP contracts, slice scope, allowlist deltas, review plans, and posting
  boundary in one session.
- A finding in one domain blocks seven unrelated domains.
- Evidence bundle becomes unreviewably large.

Decision:

- Rejected.

### Alternative 3: Two-phase gated approval with per-ADR sign-off, ordered entry criteria, and a recorded evidence bundle

Pros:

- Phase 1 (design approval) reviews text precision without code pressure.
- Phase 2 (implementation authorization) verifies entry criteria, test plans,
  rollback plans, and review sign-off before any file changes.
- Each ADR keeps its accountable approvers; findings block only their domain
  plus dependents.
- Approvals expire on parent change, preventing stale implementation.

Cons:

- More process overhead than ad-hoc approval.
- Requires a scribe to record the evidence bundle and status transitions.

Decision:

- Selected proposal direction.

## Decision

### Phase 1: Design Approval

Each of ADR-0026 through ADR-0033 moves from Proposed to
Approved for implementation baseline only when all of the following hold for
that ADR:

1. Problem, context, alternatives with pros and cons, decision, and
   consequences are present and reviewable.
2. Exactness matches the ADR's promise: 0028 names every model, relation,
   constraint, and index; 0029 names every route, schema, DTO, and error;
   0030 names every file, flag, and test gate; 0031 names every permission and
   bundle entry; 0032 names every checklist item; 0033 names the transaction
   boundary and its eight writes.
3. Non-scope is explicit and ledger, posting (except 0033 planning),
   production, and canonical promotion are excluded where promised.
4. Blockers and deferred questions are listed, not assumed away.
5. Documentation links validate (`pnpm docs:check`), diff is whitespace-clean
   (`git diff --check`), and traceability, gate notes, and readiness rows are
   updated.
6. Accountable approvers per the table below have recorded approval with no
   open finding.

Design approval authorizes no file change of any kind. It authorizes continued
planning and Phase 2 review only.

### Phase 2: Implementation Authorization

After all eight Phase 1 approvals, a separate explicit authorization is
required before any draft-slice file changes. It must record:

1. Ordered entry criteria satisfied: authoring storage, authorization-policy
   storage, and persistence migration designs are approved (their own
   implementations still require their own Phase 2 authorizations in dependency
   order: authoring first, then authorization storage, then persistence, then
   draft routes).
2. Test, rollback, flag, and observability plans from ADR-0030 through
   ADR-0032 are accepted with owners and environments named.
3. Security checklist and production-impact bar from ADR-0032 have owners and
   execution slots; launch-gate items are explicitly out of scope.
4. The exact commit range or file list under authorization, matching the
   ADR-0030 allowed scope and nothing else.

Implementation authorization covers the named slice only. It never authorizes
posting implementation, canonical promotion, seed changes, or production
enablement.

### Approver Matrix

| ADR | Must approve |
| --- | --- |
| 0026 authoring | Product, Principal Engineering, Backend, Security, QA |
| 0027 authorization policy | Security, Principal Engineering, Backend, QA, Product |
| 0028 persistence | Database Architecture, Backend, Security, Principal Engineering, QA |
| 0029 API contract | Backend, Product, Security, QA, Principal Engineering |
| 0030 slice plan | Principal Engineering, Backend, QA, Security, DevOps |
| 0031 allowlist and codes | Security, Principal Engineering, Backend, QA |
| 0032 review plan | Security, QA, DevOps, Principal Engineering, Product |
| 0033 posting boundary | Principal Engineering, Database Architecture, Backend, Security, QA, Product |

The CTO may sign in place of Principal Engineering where both are listed.
Product must sign every approval that changes operator or reviewer workflow.
Security must sign every approval touching authorization, scope, audit, or
ledger effects. A missing signature is a block, not an abstention.

### Decision Rule

- Unanimous approval of the listed approvers per ADR. One open finding blocks
  that ADR and every dependent downstream of it.
- Findings are recorded against the ADR with owner and remediation; silent
  resolution is not approval.
- Status transitions are written into the ADR (`Proposed` to
  `Approved for implementation baseline`) plus the gate table, README index,
  and traceability row. A comment alone is not a status change.
- Posting (ADR-0033) approval never authorizes posting implementation; it
  authorizes continued posting-gate planning only.

### Expiry And Re-Review

An approval expires and returns its ADR to Proposed when any of the following
occurs:

- A parent ADR it depends on changes in a material way.
- The reference schema, auth middleware, or target domain packages change in a
  way that affects its exactness (models, codes, bundles, or error ownership).
- Ninety days pass without implementation authorization.
- A security finding, failed verification, or production incident implicates
  its assumptions.

Re-review covers the expired ADR and its dependents only, not the whole chain,
unless the change is cross-cutting.

## Consequences

- Reviewers share one gate definition instead of per-ADR improvisation.
- Implementation cannot start on a silent or partial approval.
- Stale approvals cannot survive parent changes.
- Posting, canonical promotion, and production enablement stay separately
  gated by construction.
- Production remains NO-GO.

## Rejected Scope

This ADR does not grant:

- Design approval to any of ADR-0026 through ADR-0033.
- Implementation authorization to any slice.
- Any code, migration, route, permission, seed, flag, or production change.
- Posting implementation or production enablement.
