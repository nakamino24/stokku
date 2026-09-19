# Domain and Database Design

**Status:** Phase 0 proposed baseline
**Database:** PostgreSQL 16+

## 1. Canonical Model

```text
Organization
  |- Membership -> User
  |- Role -> Permission
  |- Warehouse -> Zone -> Bin
  |- Product -> SKU -> UOM conversion
  |- Supplier -> Supplier SKU link -> SKU
  |- Purchase Order -> Receipt -> Putaway Task
  |- Sales Order -> Allocation -> Pick Task -> Packing Session -> Shipment
  |- Cycle Count -> Adjustment
  |- Inventory Balance -> Inventory Ledger Entry
  |- Audit Event, Idempotency Record, Outbox Event
```

Every business record is directly or transitively owned by exactly one
`organization_id`. A user may belong to many organizations. A warehouse operator
may be scoped to a subset of an organization's warehouses.

The reference schema implements the warehouse scope through
`OrganizationMemberWarehouse(organizationId, organizationMemberId, warehouseId)`.
The composite foreign keys preserve tenant integrity, and the unique constraint
prevents duplicate assignments. Existing memberships are backfilled during the
additive migration; administrators can later replace assignments explicitly.

## 2. Core Tables

| Table                      | Important fields                                                                                       | Rules                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `organizations`            | id, name, slug, timezone, currency, status                                                             | Tenant root; archive does not delete history            |
| `users`                    | id, email, name, password_hash, verified_at, status                                                    | No secrets in API DTOs                                  |
| `memberships`              | organization_id, user_id, role_id, status                                                              | Unique per organization/user                            |
| `roles`                    | organization_id, name, system flag                                                                     | Custom roles cannot exceed actor authority              |
| `permissions`              | stable permission code                                                                                 | Allowlisted; reports and audit are distinct             |
| `membership_warehouses`    | membership_id, warehouse_id                                                                            | Independent warehouse scope                             |
| `warehouses`               | organization_id, code, name, status                                                                    | Code unique within tenant                               |
| `zones`                    | warehouse_id, code, name, type                                                                         | Zone belongs to one warehouse                           |
| `bins`                     | zone_id, code, type, capacity                                                                          | Bin path unique within warehouse                        |
| `uoms`                     | organization_id, code, kind, precision                                                                 | Base UOM is explicit                                    |
| `uom_conversions`          | from_uom_id, to_uom_id, factor                                                                         | No ambiguous or cyclic conversion path                  |
| `products`                 | organization_id, name, status, category_id                                                             | Product is descriptive parent                           |
| `skus`                     | organization_id, product_id, code, barcode, base_uom_id, tracking_mode                                 | SKU code and barcode are tenant-unique                  |
| `lots`                     | organization_id, sku_id, lot_code, expiry_at                                                           | Required only for lot-tracked SKU                       |
| `serial_numbers`           | organization_id, sku_id, serial_code, status                                                           | One physical serial has one lifecycle                   |
| `inventory_balances`       | tenant, warehouse, bin, sku, lot, serial, stock_status, on_hand, allocated, hold, version              | Projection; identity is unique including nullable parts |
| `inventory_ledger_entries` | tenant, balance identity, movement_type, positive quantity, signed deltas, before/after, actor, source | Append-only; correction is reversal                     |
| `purchase_orders`          | tenant, number, supplier, status, dates                                                                | Posted receipt effect is separate                       |
| `purchase_order_lines`     | PO, SKU, ordered_qty, received_qty, base UOM                                                           | Received quantity derived from receipts                 |
| `receipts`                 | tenant, number, PO, warehouse, status, idempotency_key                                                 | Posting is exactly once                                 |
| `receipt_lines`            | receipt, PO line, accepted/rejected quantities                                                         | Rejected stock never increases on-hand                  |
| `putaway_tasks`            | receipt line, source, destination, status, assignee                                                    | Completing putaway is a physical task event             |
| `sales_orders`             | tenant, number, customer, status                                                                       | Confirmation and shipment are different effects         |
| `sales_order_lines`        | SO, SKU, ordered_qty, shipped_qty                                                                      | Shipment derives fulfillment                            |
| `allocations`              | SO line, balance, quantity, status                                                                     | Reserves a specific balance                             |
| `pick_waves`               | tenant, warehouse, status                                                                              | Groups executable work                                  |
| `pick_tasks`               | allocation, source bin, quantity, status, assignee                                                     | Short pick requires explicit exception                  |
| `packing_sessions`         | order, operator, status, package data                                                                  | Package verification before shipment                    |
| `shipments`                | order, number, warehouse, status, idempotency_key                                                      | Shipment deduction exactly once                         |
| `transfers`                | source/destination warehouse, status                                                                   | In-transit stock is explicit                            |
| `cycle_counts`             | warehouse, scope, status, approver                                                                     | Variance approval creates adjustment                    |
| `adjustments`              | reason, status, approval, source                                                                       | No silent balance edit                                  |
| `audit_events`             | tenant, actor, action, entity, request_id, payload_hash, previous_hash                                 | Restricted append-only evidence                         |
| `idempotency_records`      | tenant, key, command, request_hash, result                                                             | Same key and different request is rejected              |
| `outbox_events`            | tenant, type, aggregate, encrypted payload, status, attempts                                            | Created in same transaction as source change            |
| `sessions`                 | user, token hash, family, expiry, revocation                                                           | Refresh credentials are opaque and hashed               |
| `auth_tokens`              | user, purpose, token hash, expiry, consumed_at                                                         | Reset and verification are single-use                   |

## 3. Inventory Invariants

- `available = on_hand - allocated - hold` for every balance.
- `on_hand`, `allocated`, and `hold` cannot be negative unless a documented tenant
  policy explicitly permits negative stock for a command.
- Ledger entry `quantity` is a positive magnitude; signed delta fields represent
  the effect.
- Every ledger entry records the actor, request ID, command, source document, and
  balance snapshot before and after posting.
- A receipt increases on-hand once. Putaway changes location assignment without
  replaying the receipt increase.
- Allocation increases reserved quantity once. Release reverses the reservation;
  shipment decreases on-hand and allocated once and fulfills the allocation.
- Posted receipts, shipments, transfers, adjustments, and ledger entries cannot be
  updated or deleted by the application role.
- A reversal references exactly one original posting and cannot be reversed twice.
- All quantities are converted to the SKU base UOM before persistence.

## 4. Tenant and Warehouse Isolation

Repositories require `organization_id` in every business query. Cross-tenant
foreign keys are rejected by command validation before persistence. API database
transactions set a local tenant context used by PostgreSQL row-level security
policies. Warehouse task commands additionally require a membership-to-warehouse
scope or a documented supervisor override.

The database role used by the API cannot disable RLS or delete posted ledger and
audit rows. Migrations use a separate controlled role. Maintenance access is
time-bound, logged, and never available to browser requests.

## 5. Indexing Strategy

- Unique: `(organization_id, code)` for warehouses, bins, SKUs, document numbers,
  and barcodes where applicable.
- Balance lookup: `(organization_id, warehouse_id, sku_id, bin_id, stock_status)`.
- Allocation lookup: `(organization_id, sales_order_id, status)` and
  `(organization_id, inventory_balance_id, status)`.
- Task queues: `(organization_id, warehouse_id, status, priority, created_at)`.
- Ledger audit: `(organization_id, sku_id, warehouse_id, created_at desc)` and
  source document indexes.
- Token safety: unique token hashes and expiry indexes.
- Email delivery: `(status, available_at)` supports due-job polling; encrypted
  outbox payload columns keep one-time links out of plaintext storage.
- Append-only controls: PostgreSQL triggers reject `UPDATE` and `DELETE` on
  `StockMovement` and `AuditLog`; production grants must keep runtime ownership
  and trigger-bypass privileges separate from the migration role.
- Reports use bounded date predicates and keyset pagination. Add partitions or
  read models only after measured ledger volume requires them.

## 6. Migration and Seed Strategy

- Migrations are forward-only, reviewed SQL generated or checked through Drizzle.
- Production deployment runs `migrate` against the target database before the new
  application version starts accepting traffic.
- Destructive changes use expand, backfill, deploy, contract sequencing.
- Rollback means deploying the previous application version and applying a tested
  forward fix; production migrations are not undone destructively.
- Tests use disposable PostgreSQL databases. No test may connect to production.
- Seed data is deterministic, idempotent, and includes at least two organizations,
  separate users, warehouses, bins, catalog records, and sample inbound/outbound
  documents to prove tenant isolation.

## 7. Reconciliation

The reconciliation command is read-only. It derives balance totals from ledger
entries, compares them to projections, checks allocation and hold identities, and
emits discrepancies with request ID and severity. Repair requires a separate
authorized command that creates compensating entries and an audit event.
