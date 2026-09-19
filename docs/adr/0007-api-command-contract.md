# ADR-0007: Versioned REST Command Contract

**Status:** Accepted for review

## Problem

Generic CRUD APIs do not express physical warehouse effects or retry semantics.

## Context

Web, mobile, and future integrations need a stable contract with safe mutations.

## Alternatives

- Generic REST CRUD.
- GraphQL-first API.
- URL-versioned REST resources with named command endpoints and OpenAPI.

## Decision

Use `/api/v1`, named command endpoints, shared validation, allowlisted DTOs,
consistent request-ID errors, cursor pagination, and organization-scoped idempotency.
GraphQL is deferred.

## Consequences

Commands are more explicit and less flexible than generic CRUD, but their physical
and security effects are reviewable and testable.
