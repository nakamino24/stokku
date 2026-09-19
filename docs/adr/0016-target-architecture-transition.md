# ADR-0016: Target Architecture Transition from the Reference Runtime

**Status:** Accepted; Gate 4 target boundary implemented but inactive at runtime
**Date:** 2026-09-13
**Owners:** CTO, Principal Engineering, Architecture

## Problem

The active implementation uses Next.js Pages Router, React 18, Express, Prisma, and
an in-process outbox worker. The approved Phase 0 target defines Next.js App Router,
React 19, Hono on Node.js, Drizzle, pure domain/application boundaries, and a
separate worker. A framework-by-framework replacement would be a high-risk big-bang
rewrite and would discard current security hardening before its behavior is captured.

## Context

The reference runtime remains operational evidence only. It contains active
authorization, session, email-outbox, inventory, and database migration changes.
Target architecture documents define the desired end state, but do not authorize a
bulk source move, ORM migration, router change, or table rename.

## Alternatives

1. Rewrite every application and persistence layer in one release.
2. Keep the reference runtime indefinitely and treat its architecture as the target.
3. Introduce target boundaries through independently tested vertical slices.

## Decision

Adopt alternative 3. The repository may add target packages and feature boundaries
only when a vertical slice is approved. Each slice must include domain rules,
application service, persistence adapter, contract, HTTP route, UI feature,
authorization and tenant-isolation coverage, audit behavior, and rollback notes.

The first approved source migration slice is identity, organization membership, and
warehouse authorization. Prisma migrations, schema files, current route paths, and
the in-process outbox remain in place until a slice explicitly supersedes them.

Gate 4 begins this slice by adding framework-agnostic `domain`, `contracts`,
`validation`, and `test-fixtures` packages only. It does not add a route adapter,
persistence adapter, database mutation, or runtime import. The target boundary uses
membership as the sole organization authority; organization selectors are not proof
of access. It uses finite role and permission allowlists, explicit warehouse-scope
grants, and fail-closed decisions. `OWNER` and `ADMIN` do not receive warehouse-wide
access merely from their role; owner transfer remains separate from ordinary role
assignment.

## Consequences

- The repository will temporarily contain target and reference code paths.
- New target code must not import Express, Prisma, React, or environment variables
  into domain logic.
- The transition takes longer than a rewrite but preserves testable behavior and
  allows a per-slice rollback by routing back to the reference path.
- Any change from Hono, Drizzle, or App Router requires a superseding ADR.
- The target boundary can intentionally differ from unsafe or transitional reference
  behavior, but no runtime behavior changes until a later approved parity slice.

## Verification

- Every migrated slice passes unit, integration, authorization, tenant-isolation,
  and relevant E2E tests.
- The old path remains deployable until the corresponding migration plan is complete.
- Documentation distinguishes target requirements from reference-runtime evidence.
