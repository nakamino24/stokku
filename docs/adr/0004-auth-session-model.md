# ADR-0004: Authentication and Session Model

**Status:** Accepted for review

## Problem

The reference app uses custom bcrypt/JWT behavior and does not complete verification
or OAuth requirements.

## Context

Warehouse accounts can affect physical stock. Session theft and unverified accounts
are high-impact risks.

## Alternatives

- Continue custom JWT and bcrypt handling.
- Fully outsource identity and tenant authorization to a hosted provider.
- Use Better Auth for identity/session primitives and retain domain authorization.

## Decision

Use Better Auth primitives with an Argon2id password adapter, secure HttpOnly
refresh sessions, short-lived access credentials, rotation, reuse detection,
revocation, single-use reset and verification tokens, and OAuth state plus PKCE.
Domain roles and warehouse scopes remain Stokku-owned.

## Consequences

Authentication has a tested library boundary while warehouse authorization remains
under product control. Provider/library upgrades require security regression tests.
