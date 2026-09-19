# ADR-0006: UOM, Lot, and Serial Tracking

**Status:** Accepted for review

## Problem

Physical goods are received and picked in different units, and some customers
require traceability.

## Context

Ambiguous conversion or identity rules can corrupt stock. Not every SKU needs
lot/serial complexity in the first pilot.

## Alternatives

- Store quantities as free-form display units.
- Require lot and serial tracking for every SKU.
- Canonical base UOM with explicit optional tracking modes.

## Decision

Each SKU has one base UOM. Explicit conversion factors normalize command quantities
before persistence. Tracking mode is none, lot, serial, or expiry-enabled; enforcement
is activated only for applicable SKUs and customer requirements.

## Consequences

Quantity integrity is consistent. Lot/serial and FEFO workflows are staged after the
core online receiving and outbound loop unless a pilot requires them earlier.
