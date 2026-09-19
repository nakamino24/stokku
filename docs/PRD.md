# Product Requirements Document

**Product:** Stokku WMS
**Version:** 3.0 Phase 0 baseline
**Status:** Proposed for review

## 1. Vision

Stokku gives growing businesses a fast, auditable way to move physical inventory
through real warehouse operations. It should make the next correct warehouse
action obvious, while making every stock change explainable.

## 2. Problem

Businesses outgrow spreadsheets and generic inventory screens when they need to
receive partial deliveries, inspect goods, put them into bins, reserve stock for
orders, and execute pick/pack/ship work. The failure mode is not only inaccurate
stock. It is a lack of operational ownership, location context, exception handling,
and auditability.

## 3. Users

The primary users are owner or organization administrator, warehouse manager,
receiving operator, picker, packer, inventory controller, purchasing operator,
sales operator, and read-only auditor. Their responsibilities are defined in
`docs/discovery.md` and are not interchangeable with administrative roles.

## 4. Product Principles

- Inventory truth is more important than visual convenience.
- Every mutation is a named, authorized command.
- Physical work is represented as an executable task with source and destination.
- Posted documents are immutable; corrections are reversals or compensating entries.
- A failed mutation must be safe to retry and understandable to an operator.
- Tenant and warehouse scope are enforced on every read and write.
- The desktop application supports management; the tablet workflow supports work.

## 5. Pilot Scope

### P0: Must work before controlled warehouse pilot

| Area            | Requirement                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Identity        | Email/password, verification, reset, secure sessions, logout and revocation |
| Tenancy         | Organization membership, role assignment, warehouse access scope            |
| Catalog         | Products/SKUs, base UOM, barcode, reorder policy, archive behavior          |
| Locations       | Warehouse, zone, bin, location type, active/archive rules                   |
| Inventory truth | Append-only ledger, balance projection, available quantity invariant        |
| Inbound         | PO, partial receipt, inspection/quarantine, putaway task, bin confirmation  |
| Outbound        | Sales order, allocation, pick task, packing session, shipment confirmation  |
| Control         | Adjustments, cycle counts, reconciliation, protected audit events           |
| Execution UX    | Tablet layout, keyboard-wedge barcode input, clear exceptions, retry states |
| Platform        | Versioned REST API, validation, idempotency, request IDs, health/readiness  |

### P1: Build after the pilot proves the operational loop

- Camera barcode fallback and label printing.
- Supplier scorecards and scheduled operational reports.
- Transfers, advanced cycle-count planning, stock aging, and valuation.
- CSV import/export through audited asynchronous jobs.
- Outbox events, webhooks, and integration credentials.
- In-app and email notifications beyond critical exceptions.
- MFA and session/device management UI.

### P2: Future scope

- Lot and serial compliance extensions where customer requirements justify them.
- FEFO enforcement, bundles/kits, returns/RMA, supplier portal, forecasting,
  SSO, carrier optimization, and richer analytics.

## 6. Non-Goals

Stokku will not build project management, accounting/GL, POS, an e-commerce
storefront, payroll/CRM, a custom identity provider, microservices, or elaborate
offline synchronization in the pilot.

## 7. Success Measures

| Measure                  | Pilot target                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| First inbound completion | A trained operator completes a receipt and putaway without desktop-only work  |
| Inventory correctness    | Ledger and projection reconcile exactly in automated tests and pilot checks   |
| Retry safety             | Receipt, allocation, and shipment retries create no duplicate physical effect |
| Execution clarity        | Every blocked task shows a reason and a recoverable next action               |
| Authorization            | No cross-tenant, cross-warehouse, horizontal, or vertical escalation in tests |
| Adoption                 | Pilot organizations perform weekly inbound or outbound work in Stokku         |
| Reliability              | Critical posting paths have monitored error rates and documented recovery     |

## 8. Product Risks

- Warehouse workflows may be too slow under poor connectivity.
- Flexible role models can create privilege escalation if hierarchy is implicit.
- Lot/serial requirements may differ significantly by vertical.
- Free-tier hosting cannot provide a production availability guarantee.
- Reports built before inventory truth is proven may encode incorrect business logic.

Risk mitigations and release gates are defined in `docs/Security.md`,
`docs/Operations.md`, and `docs/ProductionReadiness.md`.
