# ADR-0001: WMS-Only Product Boundary

**Status:** Accepted for review

## Problem

The legacy repository and documents mix project management with inventory.

## Context

Warehouse users need reliable physical execution, not task boards, comments, or
generic collaboration. Maintaining both domains expands scope and confuses the
data, navigation, and authorization models.

## Alternatives

- Continue the hybrid product.
- Keep project management as a separate product module.
- Focus Stokku exclusively on warehouse operations.

## Decision

Stokku is a WMS. Project management, accounting, POS, storefront, and generic
workflow features are non-goals for the pilot.

## Consequences

Product, database, API, UX, and roadmap documents use warehouse terminology. Legacy
project-management material is historical discovery only.
