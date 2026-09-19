# ADR-0005: Inventory Ledger and Projection

**Status:** Accepted for review

## Problem

Fast stock reads and auditable physical history need different data shapes.

## Context

Receipts, allocations, shipments, reversals, and counts must remain explainable and
retry-safe under concurrent activity.

## Alternatives

- Mutable stock row as the source of truth.
- Event sourcing every business entity.
- Append-only inventory ledger plus repairable balance projection.

## Decision

The ledger is append-only and authoritative for inventory effects. A balance
projection stores on-hand, allocated, hold, and available quantities. Commands write
both in one transaction with idempotency and concurrency controls.

## Consequences

Reads are fast and history is auditable. Projection reconciliation and repair tools
are mandatory operational capabilities.
