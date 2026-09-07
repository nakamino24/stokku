# Inventory Core Architecture

## Source of truth

`StockMovement` is the immutable inventory transaction ledger. `StockLevel` is
the current balance projection used for fast operational reads. Every balance
mutation and its movement/audit rows are committed by `InventoryPostingService`
in one PostgreSQL transaction; business modules do not write balances directly.

A balance identity is:

`organization + warehouse + bin + product + variant + status + lot + serial`

Nullable identity components are real SQL `NULL` values. PostgreSQL 15
`NULLS NOT DISTINCT` uniqueness prevents duplicate identities without fake empty
foreign keys.

Every balance enforces:

`available = onHand - allocated - hold`

All four quantities use `DECIMAL(18,6)`. Authoritative quantity and money
calculations use `Prisma.Decimal`.

## Posting semantics

Physical quantity changes use `RECEIPT`, `ISSUE`, `ADJUSTMENT`,
`TRANSFER_OUT`, `TRANSFER_IN`, `SHIPMENT`, `RETURN`, or `REVERSAL`.
Reservation changes use `ALLOCATION` and `DEALLOCATION`. The schema also
reserves `PICK` and `PUTAWAY` for later warehouse execution modules.

Movements store signed deltas and before/after snapshots. Their `quantity` is
always a positive magnitude. Posted rows cannot be updated or deleted; a
correction is a compensating `REVERSAL` transaction.

## Allocation and sales flow

A DRAFT sales order has no inventory effect. Confirmation allocates against
specific `StockLevel` rows and creates `InventoryAllocation` records that answer
which warehouse/bin fulfills each line. Cancellation deallocates every ACTIVE
allocation. Shipment reduces both `onHand` and `allocated` exactly once and marks
allocations FULFILLED. Delivery changes business status only.

## Receiving

Each receipt creates a `GoodsReceipt` and its lines. Accepted quantity posts a
`RECEIPT` linked to the GRN; rejected quantity remains traceable but does not
increase stock. PO `PARTIALLY_RECEIVED` and `RECEIVED` states are derived from
posted accepted quantities and cannot be manually selected.

## Concurrency and retries

Inventory commands use PostgreSQL `SERIALIZABLE` transactions, optimistic
`StockLevel.version` updates, and an advisory transaction lock when a nullable
balance identity is created. Serialization/unique-key races are retried up to
three times. This prevents two requests from allocating the same last unit.

Every inventory command has an organization-scoped idempotency key. HTTP stock
adjustment, transfer, reversal, and receiving endpoints require an
`Idempotency-Key` header. Retrying the same command returns the prior result and
does not append another movement.

## Authorization

`OrganizationMember` is the authoritative assignment. It points to a `Role`
whose `RolePermission` rows are checked per action. `User.role` remains a
transitional token mirror for compatibility; a stale privileged token cannot
override a downgraded membership. OWNER and ADMIN are wildcard system roles.

## Reconciliation

`GET /api/v1/stock/reconciliation` sums signed ledger deltas per balance and
compares `onHand`, `allocated`, `hold`, and computed `available` with the stored
projection. It is read-only and requires `inventory.reconcile`.
