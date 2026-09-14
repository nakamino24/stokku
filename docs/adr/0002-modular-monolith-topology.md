# ADR-0002: Modular Monolith and Deployment Topology

**Status:** Accepted for review

## Problem

The WMS needs transactionally consistent commands without premature operations
complexity.

## Context

The pilot has one PostgreSQL source of truth and a small team. Independent services
would make inventory consistency, local development, and incident response harder.

## Alternatives

- Microservices.
- Edge functions with a serverless database abstraction.
- Feature-first modular monolith on Node and PostgreSQL.

## Decision

Use a modular monolith with Next.js web, Hono Node API, optional worker, and Neon
PostgreSQL. Use Vercel -> Render -> Neon for the controlled pilot; do not treat its
free tier as a production SLA.

## Consequences

Feature boundaries and dependency rules are enforced in code review and tests.
Extraction remains possible after measured need and a new ADR.
