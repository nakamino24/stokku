# ADR-0014: Transactional Email Outbox

**Status:** Accepted; implemented for the single-process API deployment

## Problem

Email delivery is an external side effect. Sending directly from an auth request
after a database transaction can leave a committed account without a durable record
of a message when the provider or process fails.

## Context

Verification and password-reset requests already generate opaque tokens and store
only their hashes. The message payload must be durable without placing the raw token
in application logs. The API currently runs as one long-lived Render process, so a
bounded in-process worker can provide delivery without introducing a second service.

## Alternatives

- Send email synchronously from the request.
- Add a managed queue immediately.
- Write an email outbox row in the same transaction and process it with a bounded
  worker.

## Pros

- Account state and message intent commit atomically.
- Provider outages can be retried without asking users to repeat auth requests.
- The worker can recover stale claims after process termination.
- The provider interface remains independent of queue infrastructure.

## Cons

- A worker must run in every API process unless deployment is split later.
- At-least-once delivery means provider idempotency must be considered.
- Reset and verification URLs are encrypted in the outbox payload; they must never
  be logged or returned by administrative APIs.

## Decision

Persist `EmailOutboxMessage` rows transactionally with the auth state change. A
bounded worker claims due rows, sends through `EmailProvider`, marks successes as
`SENT`, and schedules exponential retries. Claims older than the lock timeout are
returned to `PENDING`. The worker has a per-run batch limit and a maximum attempt
count; exhausted messages become `FAILED` for operational inspection. Email bodies
are encrypted with AES-256-GCM at rest, and provider requests carry the outbox ID as
an idempotency key.

## Consequences

Auth requests no longer depend on provider availability after the database commit.
Delivery is eventually consistent and requires worker metrics, retry monitoring, and
an eventual move to a dedicated queue when multiple API replicas are introduced.
