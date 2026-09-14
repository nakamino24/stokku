# ADR-0010: Mobile and Barcode Execution

**Status:** Accepted for review

## Problem

The warehouse floor cannot depend on desktop-only workflows or manual typing.

## Context

Operators use tablets and hardware scanners with variable connectivity. Camera
scanning and offline sync add reliability risks.

## Alternatives

- Desktop-only CRUD screens.
- Native mobile applications immediately.
- Responsive web task flows with keyboard-wedge scanning first.

## Decision

Build tablet-first responsive web workflows. Support keyboard-wedge barcode input in
the pilot and add camera fallback after measurement. Defer complex offline writes.

## Consequences

One web client serves management and floor operations. Device-specific hardware
testing and slow-network states are part of acceptance.
