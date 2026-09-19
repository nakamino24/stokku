# ADR-0003: Tenant and Warehouse Authorization

**Status:** Accepted; Phase 1 implementation in progress

## Problem

Organization membership alone is insufficient for safe warehouse-floor operations.

## Context

The same user may belong to multiple organizations or only some warehouses. Role
claims in access tokens can become stale after a role change.

## Alternatives

- Trust organization and role claims in the access token.
- Organization membership only.
- Membership plus permission and warehouse-scope checks on every request.

## Decision

Membership is authoritative. Every request resolves active membership, evaluates a
permission, and verifies warehouse scope for operational commands. Owner transfer,
role changes, and warehouse scope changes are named commands with higher-authority
checks. Database tenant context and RLS provide defense in depth.

The reference implementation represents scope with `OrganizationMemberWarehouse`.
OWNER and ADMIN are organization-wide; other roles require explicit assignments.
The migration backfills existing memberships to all existing warehouses to avoid an
implicit access change during rollout. New assignments are managed through the
user warehouse-scope command and are audited.

## Consequences

Authorization is explicit and requires more queries or cached membership reads.
Stale tokens cannot preserve downgraded authority.
