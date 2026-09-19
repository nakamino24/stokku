# Product Discovery Baseline

**Status:** Phase 0 proposed baseline
**Scope:** WMS rebuild

## Product Boundary

Stokku is an operational warehouse management system, not a project-management
suite, accounting system, POS, storefront, or generic workflow engine. The core
promise is trustworthy inventory execution from inbound receipt through outbound
shipment.

## Target Customers

Growing wholesale, retail, distribution, and light manufacturing businesses with
one or more warehouses, roughly 5 to 500 employees, and a need to replace
spreadsheets or disconnected inventory tools.

## Users

| User                                | Primary responsibility              | Main outcome                                  |
| ----------------------------------- | ----------------------------------- | --------------------------------------------- |
| Owner or organization administrator | Tenant, people, policy              | Safe organizational control                   |
| Warehouse manager                   | Floor execution and exceptions      | Work completed accurately and on time         |
| Receiving operator                  | Inspect and receive inbound goods   | Accepted stock reaches the right location     |
| Picker                              | Execute outbound pick tasks         | Correct stock is picked from the directed bin |
| Packer                              | Verify and pack picked goods        | Shipment is complete and traceable            |
| Inventory controller                | Counts, adjustments, reconciliation | Ledger and physical stock agree               |
| Purchasing operator                 | Suppliers and purchase orders       | Demand is replenished predictably             |
| Sales operator                      | Customer orders and allocation      | Orders are promised from real availability    |
| Read-only auditor                   | Reports and audit evidence          | Activity can be independently reviewed        |

## Core Business Journey

`Plan inventory -> Receive inbound goods -> Inspect and quarantine if needed -> Put away -> Count and reconcile -> Allocate outbound demand -> Pick -> Pack -> Ship -> Report`

## Legacy Findings

The legacy application provides useful evidence for:

- Decimal stock quantities and a PostgreSQL transactional model.
- Append-oriented movements and idempotent inventory mutations.
- Purchase-order receiving and sales-order allocation concepts.
- A first organization and role model.
- Playwright workflow coverage that can guide acceptance tests.

The legacy application does not provide an approved target architecture. Its
project-management features, client-side state paths, local storage mutations,
and generic CRUD screens are excluded from the rebuild.

## Pain Points To Solve

| Pain point                                   | Operational consequence                       | Product response                                         |
| -------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Stock changes are mostly read-only in the UI | Warehouse work happens outside the system     | Named executable commands and floor workspaces           |
| No bin-directed execution                    | Mis-picks and slow putaway                    | Warehouse, zone, bin, source, and destination tasks      |
| Receiving lacks inspection and putaway       | Accepted stock becomes hard to find           | Receipt, quality disposition, and putaway task chain     |
| Sales status is not physical execution       | Orders look complete when goods are not       | Allocation, pick, pack, shipment commands                |
| Weak tenant and role boundaries              | Cross-tenant exposure or privilege escalation | Membership plus warehouse-scope authorization            |
| Reset and verification are incomplete        | Account takeover and untrusted accounts       | Single-use tokens, verified identity, session revocation |
| Reporting and audit are too broad            | Sensitive data exposure                       | Dedicated permissions and scoped exports                 |
| Mutation failures are unclear                | Operators retry blindly                       | Stable error codes, request IDs, and retry guidance      |

## Prioritization

The PRD owns priority. This discovery document records the reasoning only.

- **Pilot:** secure identity, tenant isolation, catalog, warehouse/bin hierarchy,
  inventory truth, receiving, inspection, putaway, allocation, pick, pack, ship,
  reconciliation, audit, and tablet-first execution.
- **After pilot:** advanced valuation, scheduled reports, CSV jobs, outbox-based
  integrations, supplier scorecards, camera scanning, and richer notifications.
- **Future:** MFA, serial/lot compliance extensions, bundles, forecasting,
  carrier optimization, supplier portal, SSO, and complex offline synchronization.

## Explicit Non-Goals

- Project management, tasks, comments, calendars, or generic collaboration.
- Microservices before a measured scaling requirement.
- Event sourcing for every domain entity.
- AI forecasting before operational data is trustworthy.
- POS, accounting, or e-commerce storefront behavior.
- Custom identity provider.
- Full offline synchronization before online workflows are stable.
