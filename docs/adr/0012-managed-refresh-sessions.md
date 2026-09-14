# ADR-0012: Managed Refresh Sessions

**Status:** Accepted; Phase 1 implementation in progress

## Problem

Long-lived refresh credentials must be revocable, single-use during rotation, and
safe against replay. A stateless refresh JWT cannot provide reliable reuse
detection or session-family invalidation.

## Context

Stokku already has a server-side `RefreshSession` record containing a hash of the
opaque refresh token, its family, expiry, and revocation metadata. Access tokens
remain short-lived bearer credentials; refresh tokens are kept in an HttpOnly cookie
and are never returned to the browser response body.

## Alternatives

- Use stateless long-lived refresh JWTs.
- Store raw refresh tokens in the database.
- Store hashed opaque refresh tokens and rotate them transactionally.

## Decision

Use hashed opaque refresh tokens in `RefreshSession`. Every successful refresh
atomically revokes the presented session and creates its successor in the same
family. A replayed rotated token revokes the entire family, except for a short
concurrency grace response that tells the caller the credential was already rotated.
Expiry, logout, password changes, and account deactivation revoke sessions. A
separate authenticated `logout-all` command revokes all sessions for the user.

## Consequences

Refresh requires a database lookup and transaction, but compromise response is
immediate and session activity is auditable. The refresh cookie remains scoped to
the authentication API path, HttpOnly, Secure in production, and SameSite=Lax.
