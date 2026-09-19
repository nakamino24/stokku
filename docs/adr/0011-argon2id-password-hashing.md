# ADR-0011: Argon2id Password Hashing

**Status:** Accepted; implementation in progress

## Problem

Passwords must be protected against offline cracking with a memory-hard password
hashing function. The reference application currently uses bcryptjs, while the
launch security baseline requires Argon2id.

## Context

Existing users may already have bcrypt hashes in the database. Requiring an
immediate password reset would create an avoidable account-lockout event during
deployment. Password hashes are self-describing, so legacy bcrypt hashes can be
identified without storing or exposing a second credential.

## Alternatives

- Keep bcryptjs permanently.
- Force every existing user through a password reset before deployment.
- Verify legacy bcrypt hashes only during migration and rehash successful logins
  with Argon2id.

## Pros

- Argon2id provides memory-hard resistance to offline cracking.
- Opportunistic rehashing avoids mass account lockout.
- New passwords are Argon2id immediately.
- The migration can be measured by counting remaining bcrypt prefixes.

## Cons

- bcryptjs remains a temporary migration dependency.
- A legacy account must authenticate successfully once before its hash is upgraded.
- Argon2id parameters require capacity testing in each deployment environment.

## Decision

Use Argon2id with explicit production parameters of 64 MiB memory, three iterations,
and one lane. New registrations, password changes, and password resets always use
Argon2id. Login verifies legacy bcrypt hashes only when the stored value has a
recognized bcrypt prefix, then upgrades the hash in a best-effort database update.
The upgrade never changes the authentication result or logs password material.

## Consequences

The API has one password service boundary and no direct hashing calls in feature
services. Bcrypt can be removed after the legacy-hash inventory reaches zero and a
separate migration decision is approved.
