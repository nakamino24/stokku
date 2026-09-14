# ADR-0008: Outbox and Asynchronous Jobs

**Status:** Accepted for review

## Problem

Email, exports, and webhooks must not make inventory posting unreliable.

## Context

External providers fail and retry. A successful stock transaction must not be
rolled back because an email provider is unavailable.

## Alternatives

- Perform external calls inside the transaction.
- Add a queue and microservice immediately.
- Write an outbox event in the transaction and process it with one worker.

## Decision

Critical source changes and outbox events commit together. A worker claims events,
delivers with bounded retries, records attempts, and moves poison messages to a
dead-letter state for operator action.

## Consequences

External delivery is eventually consistent and observable. The worker remains a
small optional deployment until a real asynchronous workload exists.
