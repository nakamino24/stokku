# Warehouse UX Strategy

**Status:** Phase 0 proposed baseline — superseded for implementation by `design-system.md`, `component-architecture.md`, and `navigation-flow.md` (Phase 3). This document remains the strategic UX reference for workflow requirements.

## 1. Information Architecture

```text
Operations
  Dashboard
  Receiving
  Putaway
  Picking
  Packing
  Shipments
Inventory
  Stock
  Transfers
  Cycle Counts
  Reconciliation
Planning
  Purchase Orders
  Sales Orders
  Products and SKUs
  Suppliers
Insights
  Reports
Administration
  Organization
  Warehouses and bins
  Members and roles
  Audit
```

The navigation adapts to the user's permission set. Warehouse operators land in
their task queue, not in a generic dashboard. Managers see exceptions and due work.
Auditors see only authorized reports and audit evidence.

## 2. Warehouse-Floor Principles

- Tablet-first layouts with a minimum 44 by 44 CSS pixel touch target.
- One primary task per screen: identify item, confirm quantity, confirm location,
  finish or raise an exception.
- Barcode input supports keyboard-wedge scanners first. Camera scanning is a
  fallback and must not be required for the core pilot workflow.
- Source and destination locations are always visible before confirmation.
- Quantities are shown in the operator's selected UOM and canonical base quantity
  where conversion matters.
- Irreversible actions require a clear confirmation and an accessible announcement.
- Network failure preserves safe form state and never implies a mutation succeeded.
- Offline support is limited to read caching until online workflows are measured.

## 3. Receiving and Putaway Journey

1. Operator opens `Receiving` and sees due purchase orders, expected lines, and
   exceptions.
2. Operator selects a PO, scans or searches a SKU, and enters the physically
   received quantity.
3. The UI shows ordered, already received, current, and remaining quantities.
4. Operator chooses accepted, rejected, or quarantine disposition and records a
   reason where required.
5. Posting creates the receipt exactly once and creates putaway work for accepted
   stock. The success state includes the receipt number and task count.
6. Operator opens a putaway task, sees source staging and destination bin, scans the
   bin, confirms quantity, and completes the task.
7. Variance, damaged goods, unknown SKU, or blocked bin routes to an exception with
   a clear supervisor action. It does not silently change stock.

## 4. Outbound Journey

1. Sales operator confirms an order and sees allocated, unavailable, or backordered
   lines.
2. Manager creates or releases a pick wave for a warehouse.
3. Picker claims a task, scans the source bin and SKU, confirms quantity, and either
   completes or submits a short-pick exception.
4. Packer scans the order and each picked item, resolves discrepancies, and closes a
   packing session.
5. Authorized shipper confirms shipment. The UI clearly states that physical stock
   will be deducted and shows the idempotent confirmation state.

## 5. Management Journeys

- Inventory controller starts a cycle count, enters counts by bin, reviews variance,
  and submits an adjustment for approval.
- Purchasing operator uses low-stock signals to create a PO, submits it, and tracks
  receipt progress without editing posted receipt history.
- Auditor filters audit events by date, actor, command, warehouse, or source
  document. Export is permissioned and itself audited.

## 6. Required Screen States

Every route and task view defines loading, skeleton where useful, empty, permission
denied, validation error, conflict, network failure, rate limit, and successful
completion states. Mutation errors include a human-readable action, such as “Refresh
the task before retrying” or “Ask a supervisor to resolve this short pick.”

## 7. Accessibility

- Semantic landmarks, skip link, visible focus, logical tab order, and keyboard
  operation for all workflows.
- Labels and descriptions are programmatically associated with inputs.
- Status is conveyed with text and iconography, not color alone.
- Screen-reader live regions announce task completion, exceptions, and retries.
- Dialogs trap and restore focus; destructive confirmation is keyboard accessible.
- Reduced motion follows `prefers-reduced-motion`.
- Contrast and text resizing are verified against WCAG 2.2 AA.
