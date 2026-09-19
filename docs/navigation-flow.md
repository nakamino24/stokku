# Navigation Flow & Wireframes

**Status:** Phase 3 — ready for implementation
**Dependencies:** Design System Specification (`design-system.md`), Component Architecture (`component-architecture.md`)

---

## 1. Information Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │                        STOKKU                               │
  │                                                             │
  ├─────────────────┬───────────────────────────────────────────┤
  │   Sidebar       │   Main Content Area                       │
  │                 │                                           │
  │   Operations ▼  │   ┌─────────────────────────────────┐     │
  │   ├ Dashboard   │   │ Page Header                     │     │
  │   ├ Receiving   │   │ Title              [Action Btn] │     │
  │   ├ Putaway     │   ├─────────────────────────────────┤     │
  │   ├ Picking     │   │ Filter / Search Bar             │     │
  │   ├ Packing     │   ├─────────────────────────────────┤     │
  │   └ Shipments   │   │ Table / Task List               │     │
  │                 │   │   ┌──────────────────────┐      │     │
  │   Inventory ▼   │   │   │ Status │ Data │ Qty  │      │     │
  │   ├ Stock       │   │   ├──────────────────────┤      │     │
  │   ├ Transfers   │   │   │ ...                  │      │     │
  │   ├ Cycle Counts│   │   │ ...                  │      │     │
  │   └ Reconcil.   │   │   └──────────────────────┘      │     │
  │                 │   ├─────────────────────────────────┤     │
  │   Planning ▼    │   │ Pagination          [1] [2] [3] │     │
  │   ├ P.O.s       │   └─────────────────────────────────┘     │
  │   ├ S.O.s       │                                           │
  │   ├ Products    │                                           │
  │   └ Suppliers   │                                           │
  │                 │                                           │
  │   Insights ▼    │                                           │
  │   └ Reports     │                                           │
  │                 │                                           │
  │   Admin ▼       │                                           │
  │   ├ Org         │                                           │
  │   ├ Warehouses  │                                           │
  │   ├ Members     │                                           │
  │   └ Audit       │                                           │
  └─────────────────┴───────────────────────────────────────────┘
```

### 1.1 Navigation Adaptation

| Role | Default Landing | Sidebar Sections |
|------|----------------|------------------|
| Warehouse Operator | Task queue (Picking) | Operations only |
| Inventory Manager | Dashboard | Operations, Inventory, Planning |
| Admin | Dashboard | All sections |
| Auditor | Audit log | Insights (reports + audit only) |
| Viewer | Dashboard (read-only) | All sections, read-only |

The sidebar hides sections that contain no accessible routes for the current user.

---

## 2. Page Wireframes

### 2.1 Dashboard (Manager View)

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                              [Date Range] [▸]  │
│                                                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│ │ 245  │ │  32  │ │ 12   │ │ 3    │                     │
│ │ Open │ │ POs  │ │ Picks│ │ Excep│                     │
│ │ Tasks│ │ Due  │ │ Today│ │      │                     │
│ └──────┘ └──────┘ └──────┘ └──────┘                     │
│                                                          │
│ Recent Activity                  Quick Actions           │
│ ┌────────────────────────────┐  ┌──────────────┐        │
│ │ John picked PO-1042 (12s)  │  │ New Receiving │        │
│ │ Maria received PO-1039 (2m)│  ├──────────────┤        │
│ │ System: cycle count ▸ adj  │  │ Start Picking │        │
│ │ SKU-4455 low stock (5 rem) │  ├──────────────┤        │
│ └────────────────────────────┘  │ Cycle Count   │        │
│                                 └──────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Receiving — PO List

```
┌──────────────────────────────────────────────────────────┐
│ Receiving                        [New Receiving] [Search] │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ◉ PO-1042 │ Supplier Co. │ Due Today │ 3/5 lines  ▸ │ │
│ │   Priority: High          1 items short              │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ ○ PO-1039 │ Vendor Inc.  │ Due 09/15 │ 0/3 lines  ▸ │ │
│ │   Awaiting arrival                                   │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ ○ PO-1038 │ Supplier Co. │ Due 09/17 │ 1/4 lines  ▸ │ │
│ │   Partial receipt in progress                        │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ [Load More]                                              │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Receiving — Line Scan (Task View)

```
┌──────────────────────────────────────────────────────┐
│ ◀ Receiving › PO-1042                                │
│                                                        │
│ Supplier Co.              PO-1042 · Due today          │
│ ────────────────────────────────────────────────────── │
│                                                        │
│ Line 2 of 5                    Status: Scanned ██░░░   │
│                                                        │
│ SKU: 4455-AB-01                                        │
│ Widget, Large (Blue)                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │                                                    │ │
│ │   Scan or enter SKU...          [🔍 Scan]          │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Ordered: 100    Already received: 40    Remaining: 60  │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Received:          [       60      ]  [pcs] ▸     │ │
│ │ Disposition:       ◉ Accept  ○ Reject  ○ Quarantine │
│ │ Reason (if reject):                                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [Complete Line]           [Save & Next Line]           │
└──────────────────────────────────────────────────────┘
```

### 2.4 Picking — Task Assignment

```
┌──────────────────────────────────────────────────────────┐
│ Picking                           [Claim Task] [Refresh] │
│                                                          │
│ Available Pick Waves                                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Wave W-103 │ 45 items │ 3 orders │ Zone A     [Claim]│ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Wave W-102 │ 22 items │ 2 orders │ Zone B     [Claim]│ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ My Active Picks                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ◉ Pick P-8712 │ 15/45 done │ Started 08:32    [▶]   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Completed Today: 4 waves · 127 items picked              │
└──────────────────────────────────────────────────────────┘
```

### 2.5 Picking — Execute

```
┌──────────────────────────────────────────────────────┐
│ ◀ Picking › Wave W-103 › Pick P-8712                 │
│                                                        │
│ Item 8 of 45                     ⬜⬜⬜⬜⬜⬜⬜⬜█░░░░     │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │   Warehouse A › Aisle 03 › Rack 14 › Bin B         │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ SKU: 4455-AB-01                                        │
│ Widget, Large (Blue)                                    │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │   Scan or enter bin location...                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Expected: 12    [       12      ]  [pcs]               │
│                                                        │
│ [Confirm Pick]               [Short Pick ⚠]            │
│                                                        │
│ ────────────────────────────────────────────────────── │
│ Destination: Packing Station 4                         │
└──────────────────────────────────────────────────────┘
```

### 2.6 Cycle Count — Bin Review

```
┌──────────────────────────────────────────────────────────┐
│ Cycle Count › Zone A                                     │
│                                                          │
│ Count in progress · Started 09:00                        │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Bin: A-03-14-B                                       │ │
│ │                                                      │ │
│ │ ┌──────────┬──────────┬──────────┬────────────┐     │ │
│ │ │  SKU     │ Expected │ Counted  │ Variance   │     │ │
│ │ ├──────────┼──────────┼──────────┼────────────┤     │ │
│ │ │ 4455-AB  │   24     │   24     │    0       │ ✓   │ │
│ │ │ 8892-CX  │   12     │   11     │   -1       │ ⚠   │ │
│ │ │ 3311-DB  │    6     │    6     │    0       │ ✓   │ │
│ │ └──────────┴──────────┴──────────┴────────────┘     │ │
│ │                                                      │ │
│ │ [Add SKU]                              [Submit Bin] │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Summary: 3 bins done · 12 remaining in zone              │
└──────────────────────────────────────────────────────────┘
```

### 2.7 Mobile — Task View (Tablet)

```
┌──────────────────────────────────┐
│  ◀ Wave W-103                    │
│                                  │
│  Warehouse A                     │
│  ├─ Aisle 03 ▸ 14 bins          │
│  │  ├─ Rack 10  (5 items) ✓     │
│  │  ├─ Rack 11  (3 items) ✓     │
│  │  ├─ Rack 12  (4 items) ✓     │
│  │  └─ Rack 13  (2 items) ▸     │
│  └─ Aisle 04 ▸ 8 bins           │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Items remaining: 24     │    │
│  │  Est. time: 18 min      │    │
│  └──────────────────────────┘    │
│                                  │
│  [Pause]        [Complete Wave]  │
└──────────────────────────────────┘
```

---

## 3. User Journeys

### 3.1 Receiving Journey

```
PO Arrives
  │
  ├→ Operator opens Receiving → sees due POs
  │     │
  │     ├→ Selects PO → sees line list
  │     │     │
  │     │     ├→ Scans SKU → enters quantity → selects disposition
  │     │     │     │
  │     │     │     ├→ Accept → posts receipt → creates putaway task
  │     │     │     │              │
  │     │     │     │              └→ Success toast: "Receipt R-1042 created.
  │     │     │     │                 3 putaway tasks ready"
  │     │     │     │
  │     │     │     ├→ Reject → enter reason → moves to exception queue
  │     │     │     │              │
  │     │     │     │              └→ Supervisor must approve rejection
  │     │     │     │
  │     │     │     └→ Quarantine → enter reason → creates quarantine task
  │     │     │
  │     │     └→ Completes all lines → PO status changes to "Received"
  │     │
  │     └→ Partial: marks lines outstanding
  │
  └→ Exception: unknown SKU → operator enters new SKU details → continues
```

### 3.2 Putaway Journey

```
Putaway Task Created (from receiving or transfer)
  │
  ├→ Operator opens Putaway → sees task list sorted by zone
  │     │
  │     ├→ Opens task → sees item + source location (staging)
  │     │     │
  │     │     ├→ Scans destination bin → system validates bin
  │     │     │     │
  │     │     │     ├→ Bin valid → confirms quantity → stock moved
  │     │     │     │              │
  │     │     │     │              └→ Success toast → next task loads
  │     │     │     │
  │     │     │     └→ Bin invalid/full → exception panel with alternatives
  │     │     │
  │     │     └→ Multiple items → completes all → task batch done
  │     │
  │     └→ Recommended bin shown based on velocity zone
  │
  └→ Exception: bin cannot accept item → supervisor reassigns zone
```

### 3.3 Picking Journey

```
Sales Order Created → Allocation Runs → Pick Wave Generated
  │
  ├→ Picker claims wave → sees item list grouped by zone/aisle
  │     │
  │     ├→ Navigates to source bin → scans bin
  │     │     │
  │     │     ├→ Scans SKU → confirms picked quantity
  │     │     │     │
  │     │     │     ├→ Quantity matches → item complete → move to next
  │     │     │     │
  │     │     │     └→ Short pick → enter actual quantity
  │     │     │            │
  │     │     │            └→ System allocates remainder or backorders
  │     │     │
  │     │     └→ All items picked → wave moves to Packing
  │     │
  │     └→ Real-time progress bar: 32/45 items
  │
  └→ Exception: item not found → supervisor override or substitution
```

### 3.4 Cycle Count Journey

```
Cycle Count Scheduled (system or manager)
  │
  ├→ Inventory Controller opens Cycle Counts → sees bins to count
  │     │
  │     ├→ Selects zone → sees bin list with expected SKUs
  │     │     │
  │     │     ├→ Enters bin → counts all SKUs in bin
  │     │     │     │
  │     │     ├→ If variance < threshold → auto-approved adjustment
  │     │     │
  │     │     └→ If variance > threshold → requires supervisor approval
  │     │
  │     └→ All bins counted → cycle count closed
  │
  └→ Audit trail: who counted, when, what was found vs expected
```

---

## 4. Screen States (Every Route)

Every route and task view must define:

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton variant matching content shape |
| **Empty** | EmptyState with illustration, heading, and CTA |
| **Permission denied** | Polite message: "You don't have access to this section" |
| **Validation error** | Field-level + summary; form stays populated |
| **Conflict** | Toast: "This record was modified by another user. Refresh before retrying." |
| **Network failure** | Inline error with retry button; form state preserved |
| **Rate limited** | Toast: "Too many requests. Please wait a moment." |
| **Success** | Toast with action/next step; data refreshes |
| **Not found (404)** | ErrorBoundary fallback with navigation link |

---

## 5. Modal & Dialog Placement

| Trigger | Component | Position |
|---------|-----------|----------|
| Create entity | Drawer (right) | Slide from right, 480px |
| Edit entity | Drawer (right) | Slide from right, 480px |
| Confirm irreversible action | ConfirmationDialog | Center overlay, 420px |
| Scan error / exception | ExceptionPanel | Inline in task view |
| Pick zone / date range | Drawer (bottom, mobile) | Bottom sheet |
| View audit details | Modal (lg) | Center overlay, 640px |
| Mobile filters | Drawer (bottom) | Bottom sheet |
| User menu | Dropdown | Top-right, 240px |