# ADR-0013: Transactional Email Provider

**Status:** Accepted; implementation in progress

## Problem

Account verification and password reset links must be delivered reliably in
production. Logging links or silently dropping them creates either a security risk
or an unusable authentication flow.

## Context

The API owns token generation and stores only token hashes. Email delivery is an
external side effect and must not be treated as a database transaction guarantee.
The initial deployment target prioritizes a free operational footprint and a small,
well-documented integration surface.

## Alternatives

- Continue logging links in production.
- Operate SMTP directly from the API.
- Use a transactional email API with a narrow provider interface.

## Pros

- Provider credentials remain server-side.
- Resend has a simple HTTPS API and a free tier suitable for early deployment.
- A local interface keeps auth services independent of provider-specific details.
- Provider failures are observable and are isolated behind the transactional outbox.

## Cons

- Delivery depends on an external provider and verified sender domain.
- Delivery is eventually consistent and requires worker monitoring and sender-domain
  operations.
- Free-tier quotas are not a production scale guarantee.

## Decision

Use Resend through `EmailProvider`. Development logs a safe, local-only message;
production calls the Resend HTTPS API. Production startup fails closed when
`RESEND_API_KEY` or `EMAIL_FROM` is missing. Verification and password-reset senders
share the provider boundary, while templates remain feature-specific.

## Consequences

The deployment must configure a verified sender and monitor provider failures.
Database commits and email delivery are now decoupled by the transactional outbox;
the next scale step is moving processing to a dedicated worker before multiple API
replicas are deployed.
