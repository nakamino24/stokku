# Software Requirements Specification

**Product:** Stokku WMS
**Version:** 3.0 Phase 0 baseline
**Status:** Proposed for review

## 1. Requirement Convention

Requirements use `MUST` for release obligations, `SHOULD` for planned quality
expectations, and `MAY` for future capability. P0/P1/P2 priorities are defined by
the PRD and must not be redefined in implementation tickets.

## 2. Functional Requirements

### Identity and access

- `AUTH-01` The system MUST hash passwords with Argon2id and never return or log
  password hashes, reset tokens, verification tokens, cookies, or credentials.
- `AUTH-02` Registration MUST create an unverified identity and send a single-use,
  expiring verification token. Unverified users MUST not access warehouse data.
- `AUTH-03` Password reset MUST use a single-use, expiring, hashed token and MUST
  revoke active sessions after successful reset.
- `AUTH-04` Sessions MUST use a Secure, HttpOnly, SameSite refresh cookie, short-lived
  access credentials, rotation, reuse detection, and explicit revocation.
- `AUTH-05` Google OAuth MUST use state and PKCE, bind the callback to the initiating
  session, and not allow an OAuth account to bypass tenant policy.
- `AUTH-06` Each request MUST resolve an active organization membership before any
  tenant data is read or changed.
- `AUTH-07` Role changes MUST require a higher-authority permission and MUST reject
  owner promotion, owner removal, or self-escalation unless the explicit owner
  transfer command is authorized.

### Tenant and warehouse scope

- `TEN-01` Every transactional table MUST contain or derive an organization scope.
- `TEN-02` Warehouse operations MUST verify both organization membership and
  warehouse membership or assigned scope.
- `TEN-03` Reports and audit records MUST use separate permissions from ordinary
  operational reads.
- `TEN-04` Archived master data MUST remain referentially safe; posted history MUST
  remain queryable and auditable.

### Inventory truth

- `INV-01` The inventory ledger MUST be append-only after posting.
- `INV-02` The balance projection MUST be derived from transactional commands and
  MUST satisfy `available = onHand - allocated - hold`.
- `INV-03` Quantities MUST use a canonical base unit and explicit UOM conversions.
- `INV-04` Physical and reservation mutations MUST run in a database transaction,
  prevent negative available stock unless an organization policy explicitly allows
  it, and be safe to retry with an idempotency key.
- `INV-05` Reversals MUST create compensating entries and MUST NOT silently edit a
  posted receipt, shipment, adjustment, or transfer.
- `INV-06` Reconciliation MUST compare ledger-derived quantities to projections and
  report discrepancies without changing stock.

### Inbound

- `INB-01` A purchase order MUST support draft, submitted, approved, sent, partial,
  received, cancelled, and closed states with explicit transition rules.
- `INB-02` A receipt MUST support partial quantities, over-receipt policy, quality
  disposition, rejected quantities, and an immutable receiving audit trail.
- `INB-03` Accepted receipt quantity MUST increase physical stock exactly once.
- `INB-04` Putaway MUST move or assign stock to a confirmed destination without
  duplicating the receipt effect.
- `INB-05` Receiving exceptions MUST expose the affected line, reason, policy, and
  next allowed action.

### Outbound

- `OUT-01` A confirmed sales order MUST allocate available stock to specific
  warehouse/bin balances according to an explicit allocation policy.
- `OUT-02` Allocation, release, pick, pack, and ship MUST be separate operational
  events; a status label alone is not evidence that physical work occurred.
- `OUT-03` Shipment confirmation MUST deduct physical stock exactly once and fulfill
  the corresponding allocation.
- `OUT-04` Short picks, substitutions, partial shipments, and blocked stock MUST
  have explicit policy and supervisor handling.

### Execution UX

- `UX-01` Receiving, putaway, picking, packing, and cycle counting MUST be usable
  on a tablet viewport with touch targets of at least 44 CSS pixels.
- `UX-02` Hardware scanners using keyboard-wedge input MUST work without requiring
  focus on a hidden field; camera scanning MAY be a fallback.
- `UX-03` Critical mutations MUST announce success and failure accessibly, preserve
  request IDs, and provide safe retry guidance.
- `UX-04` Every route MUST define loading, empty, recoverable error, permission
  denied, and slow-network states.

## 3. Non-Functional Requirements

- `SEC-01` No known critical vulnerability, leaked production credential, or
  untested tenant-isolation path may remain at launch.
- `SEC-02` API responses MUST use allowlisted DTOs. ORM entities MUST never be
  serialized directly.
- `SEC-03` State-changing browser requests MUST pass origin/CSRF checks appropriate
  to the cookie model. CORS MUST be an exact allowlist.
- `SEC-04` Requests MUST have a correlation ID. Structured logs MUST redact secrets
  and sensitive payloads.
- `PERF-01` Operational reads SHOULD meet p95 300 ms under the pilot load profile;
  write paths SHOULD meet p95 500 ms excluding external email delivery.
- `REL-01` Receipt, allocation, and shipment commands MUST have transaction rollback,
  idempotency, concurrency, and retry tests.
- `REL-02` Backup restore and deployment rollback MUST be exercised before launch.
- `A11Y-01` The web application MUST target WCAG 2.2 AA for supported workflows,
  keyboard access, focus management, labels, contrast, and reduced motion.

## 4. Verification Gates

Each requirement must map to at least one unit, integration, contract, or E2E test
in `docs/traceability.csv`. A requirement is not complete because a route exists;
the authorized, tenant-scoped, retry-safe, observable behavior must be verified.
