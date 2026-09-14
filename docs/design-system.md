# Design System Specification

**Status:** Phase 3 — ready for implementation
**Visual direction:** calm industrial clarity — warm off-white and graphite surfaces, cobalt action color, restrained signal-orange accent. Dense data with generous task confirmation areas.

---

## 1. CSS Custom Properties — Design Tokens

### 1.1 Theme: Light

```css
:root {
  /* Canvas & Surface */
  --color-canvas: #f6f7f9;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #f3f4f6;
  --color-surface-active: #e5e7eb;

  /* Ink */
  --color-ink: #0f172a;
  --color-ink-secondary: #475569;
  --color-ink-muted: #94a3b8;
  --color-ink-disabled: #cbd5e1;

  /* Lines */
  --color-line: #e2e8f0;
  --color-line-strong: #cbd5e1;

  /* Actions */
  --color-action: #2563eb;
  --color-action-hover: #1d4ed8;
  --color-action-strong: #1e40af;
  --color-action-subtle: #eff6ff;
  --color-action-muted: #93c5fd;

  /* Semantic */
  --color-success: #16a34a;
  --color-success-bg: #f0fdf4;
  --color-success-border: #bbf7d0;
  --color-warning: #d97706;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;
  --color-danger: #dc2626;
  --color-danger-bg: #fef2f2;
  --color-danger-border: #fecaca;
  --color-info: #2563eb;
  --color-info-bg: #eff6ff;
  --color-info-border: #bfdbfe;

  /* Signal Orange accent (sparingly) */
  --color-signal: #ea580c;
  --color-signal-bg: #fff7ed;

  /* Focus ring */
  --color-focus: #2563eb;
  --color-focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.2);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --font-numeric: 'Inter', 'JetBrains Mono', monospace;

  /* Spacing — 4px base grid, 8px primary rhythm */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm:  4px;
  --radius-md:  8px;   /* controls, inputs */
  --radius-lg:  12px;  /* panels, cards */
  --radius-xl:  16px;  /* task cards, dialogs */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
  --shadow-drawer: -4px 0 24px 0 rgb(0 0 0 / 0.08);
  --shadow-dialog: 0 25px 50px -12px rgb(0 0 0 / 0.20);

  /* Motion */
  --duration-fast:   120ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --easing-default:  cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 1.2 Theme: Dark

```css
[data-theme='dark'] {
  --color-canvas: #0a0c10;
  --color-surface: #14161a;
  --color-surface-raised: #1c1f26;
  --color-surface-hover: #262a33;
  --color-surface-active: #2e3340;

  --color-ink: #f1f5f9;
  --color-ink-secondary: #94a3b8;
  --color-ink-muted: #64748b;
  --color-ink-disabled: #475569;

  --color-line: #262a33;
  --color-line-strong: #334155;

  --color-action: #60a5fa;
  --color-action-hover: #93c5fd;
  --color-action-strong: #3b82f6;
  --color-action-subtle: #1e3a5f;
  --color-action-muted: #1e40af;

  --color-success: #4ade80;
  --color-success-bg: #052e16;
  --color-success-border: #166534;
  --color-warning: #fbbf24;
  --color-warning-bg: #451a03;
  --color-warning-border: #92400e;
  --color-danger: #f87171;
  --color-danger-bg: #450a0a;
  --color-danger-border: #991b1b;
  --color-info: #60a5fa;
  --color-info-bg: #172554;
  --color-info-border: #1e40af;

  --color-signal: #f97316;
  --color-signal-bg: #431407;

  --color-focus: #60a5fa;
  --color-focus-ring: 0 0 0 3px rgba(96, 165, 250, 0.2);

  --shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.4);
  --shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.4);
  --shadow-drawer: -4px 0 24px 0 rgb(0 0 0 / 0.5);
  --shadow-dialog: 0 25px 50px -12px rgb(0 0 0 / 0.6);
}
```

### 1.3 Typography Scale

| Token | Size   | Weight | Line Height | Used For |
|-------|--------|--------|-------------|----------|
| `text-xs`    | 0.75rem  | 400/500 | 1.25 | Metadata, help text, audit rows |
| `text-sm`    | 0.875rem | 400/500 | 1.375 | Body, table cells, form labels |
| `text-base`  | 1rem     | 400/500 | 1.5   | Paragraphs, list items |
| `text-lg`    | 1.125rem | 500/600 | 1.375 | Task headers, section titles |
| `text-xl`    | 1.25rem  | 600     | 1.25  | Page titles, dialog headers |
| `text-2xl`   | 1.5rem   | 600/700 | 1.125 | Dashboard KPI values |
| `text-display` | 2rem   | 700     | 1.1   | Welcome screen, error pages |

Tabular numerals (`font-variant-numeric: tabular-nums`) on quantities, prices, document numbers. Barcode and SKU values use `--font-mono`.

---

## 2. Component Specifications

### 2.1 Primitives

#### Button
- **Variants:** `primary`, `secondary`, `danger`, `ghost`, `outline`
- **Sizes:** `sm` (32px), `md` (40px), `lg` (48px)
- **States:** default, hover, active, disabled, loading (shows Spinner + disables), focused (ring)
- **Features:** fullWidth prop, left/right icon slot, accessible label for icon-only usage
- **Keyboard:** Enter/Space to activate; no focus trap for single button
- **Accessibility:** `role="button"`, `aria-disabled` when loading, `aria-busy` when loading

#### Input
- **Sizes:** `sm` (32px), `md` (40px), `lg` (48px)
- **States:** default, hover, focused, error, disabled, read-only, with leading/trailing adornment
- **Validation:** inline error message below, red border, error icon
- **Accessibility:** label associated via `htmlFor`/`id`, `aria-describedby` for hint/error, `aria-invalid`

#### Select
- **Variants:** native (preferred for mobile), custom dropdown (desktop)
- **States:** same as Input
- **Features:** searchable option list for large datasets, placeholder, required indicator
- **Accessibility:** `role="combobox"` for custom, native `<select>` for simple

#### Checkbox / Radio / Toggle
- **Sizes:** `sm`, `md`
- **States:** checked, indeterminate (checkbox only), disabled, error
- **Accessibility:** `<label>` wrapping, `aria-checked`, focus visible ring

#### Badge
- **Variants:** `default`, `success`, `warning`, `danger`, `info`, `neutral`
- **Sizes:** `sm` (compact), `md` (default)
- **Features:** dot-only mode (no text), removable (with close icon)
- **Accessibility:** `aria-label` with status text when dot-only

#### Text
- **Variants:** `body`, `caption`, `label`, `code`, `tabular`
- **Features:** truncation with tooltip, line-clamp, color semantic mapping

#### Separator
- **Orientation:** horizontal, vertical
- **Variants:** light, strong, with label

### 2.2 Feedback Components

#### Alert
- **Variants:** `info`, `success`, `warning`, `danger`
- **Features:** icon, title (optional), description, dismissible, action link
- **Accessibility:** `role="alert"`, `aria-live="polite"`, color + icon not sole indicator

#### Toast
- **Variants:** `success`, `error`, `info`, `warning`
- **Features:** auto-dismiss timer, manual dismiss, stacked queue, action button
- **Position:** bottom-right (desktop), bottom-center (mobile)
- **Accessibility:** `role="status"`, `aria-live="polite"`, announced by screen reader

#### EmptyState
- **Features:** illustration/icon, heading, description, action CTA
- **Sizes:** compact (inline), full (page)
- **Accessibility:** heading hierarchy preserved

#### ErrorBoundary
- **Features:** fallback UI, retry button, error details collapsed
- **Accessibility:** `role="alert"`, focus moved to error boundary on catch

#### InlineError
- **Variants:** field error, form-level error
- **Features:** icon + text, field association via `aria-describedby`

#### Skeleton
- **Variants:** text line, circle, rectangle, card, table row
- **Features:** shimmer animation respecting `prefers-reduced-motion`
- **Accessibility:** `aria-busy="true"`, `aria-label="Loading..."`

### 2.3 Data Components

#### DataTable
- **Features:** sortable columns, column visibility toggle, row selection, sticky header, pagination footer, empty state, loading rows (skeleton)
- **Responsive:** horizontal scroll on small screens, optional card layout on mobile
- **Accessibility:** `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`, sort buttons with `aria-sort`

#### StatusBadge
- **States:** mapping from workflow status to Badge variant
- **Features:** color + label, optional icon, pulse animation for in-progress states

#### FilterBar
- **Features:** text search, dropdown filters, date range, active filter chips, clear all
- **Accessibility:** search role, filter results announcement via live region

#### Pagination / CursorPagination
- **Variants:** page-based (cursor with page buttons), cursor-based (next/prev with count)
- **Accessibility:** `<nav aria-label="Pagination">`, `aria-current="page"`

#### QuantityCell
- **Features:** tabular-nums font, positive/negative/zero coloring, UOM suffix
- **States:** editable (inline edit), confirmed (green tint), pending (neutral)

### 2.4 Workflow Components

#### TaskHeader
- **Features:** task type icon, title, status badge, progress indicator, elapsed time
- **Accessibility:** `<header>` landmark, `aria-label` with task summary

#### LocationBreadcrumb
- **Features:** hierarchical path (Warehouse > Aisle > Rack > Bin), copyable, clickable segments
- **Accessibility:** `<nav aria-label="Location">`, `aria-current="location"`

#### StepProgress
- **Features:** step indicator with label, current/completed/upcoming states
- **Variants:** horizontal (desktop), vertical (mobile), numbered
- **Accessibility:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

#### ScanField
- **Features:** large input, auto-submit on Enter, barcode prefix detection, validation feedback, recent scans dropdown
- **States:** idle, scanning, success (green flash), error (red shake), duplicate warning
- **Accessibility:** `role="searchbox"`, auto-focused, inputMode optimized for scanner

#### ExceptionPanel
- **Features:** problem description, suggested action, supervisor override, timestamp
- **Accessibility:** `role="alert"`, `aria-live="assertive"`

#### ConfirmationDialog
- **Features:** title, description, confirm/cancel buttons, dangerous action variant, countdown for irreversible
- **Variants:** `default`, `danger` (red confirm button)
- **Accessibility:** `role="alertdialog"`, `aria-describedby`, focus trap, close on Escape

### 2.5 Layout Components

#### AppShell
- **Features:** sidebar, topbar, main content area, optional detail panel, responsive collapse
- **Breakpoints:** tablet (< 1024px): collapsed sidebar; mobile (< 640px): bottom nav
- **Accessibility:** skip link, `<nav>` and `<main>` landmarks

#### Sidebar
- **Features:** multi-level navigation, active indicator, collapsible sections, compact (icon-only) mode
- **State:** expanded, collapsed, mobile overlay
- **Accessibility:** `<nav aria-label="Main">`, `aria-current="page"`

#### BottomNav (mobile)
- **Features:** 4-5 primary navigation targets, active indicator, badge for notifications

#### Drawer
- **Directions:** left, right (detail panels), bottom (mobile filters)
- **Features:** overlay, close on Escape, close on click outside, swipe to close (touch)

#### Modal
- **Sizes:** `sm`, `md`, `lg`, `fullscreen` (mobile)
- **Features:** title bar, close button, `aria-labelledby`, `aria-describedby`, focus trap, restore focus on close

---

## 3. Interaction Standards

| Standard | Rule |
|----------|------|
| **Buttons** | Expose `disabled` and `loading` states. Prevent duplicate submit. `aria-busy="true"` when loading. |
| **Icon-only buttons** | Always have an accessible name via `aria-label` or tooltip. Min touch target 44x44px. |
| **Forms** | Validate at boundary. Show field-level + summary errors. Never disable submit without explanation. |
| **Tables** | Collapse low-priority columns on small screens. Card/task layout for execution workflows. |
| **Optimistic updates** | Reversible local state only. Inventory posting waits for server commit. |
| **Navigation** | All page transitions are router-level, not SPA-style replace. |
| **Keyboard** | Tab order follows visual order. Arrow navigation in comboboxes, tables (row highlight), and task lists. |
| **Focus management** | Routed pages focus `<h1>` on mount. Dialogs trap focus. Modals restore focus to trigger. |

### 3.1 Motion

| Trigger | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Hover feedback | 120ms | ease | Button, link, card hover |
| Panel/sidebar open | 200ms | --easing-default | |
| Modal/drawer enter | 180ms | --easing-default | Scale + fade |
| Page transition | 200ms | --easing-default | Fade + subtle slide |
| Task completion | 300ms | ease-out | Green flash |

All motion disabled under `prefers-reduced-motion: reduce`. Animations are non-blocking.

### 3.2 Accessibility Baseline

- WCAG 2.2 AA minimum
- Semantic landmarks: `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`
- Skip link as first focusable element
- Visible focus ring on all interactive elements (`--color-focus-ring`)
- Color is never the sole indicator of state
- Screen reader live regions for: task completion, errors, async updates
- Minimum touch target: 44x44px on tablet/mobile
- Text resizing up to 200% without loss of functionality

---

## 4. Design Principles

1. **Inventory truth first.** Every mutation is auditable. UI is the surface for trustworthy data, not a decoration.
2. **One task at a time.** Warehouse operators do one thing: identify, confirm, finish or raise exception. No split attention.
3. **Clear before fast.** Confirmations are explicit. Optimistic updates are only for reversible local state.
4. **Robust errors.** Every error state has a human-readable action. No raw error codes or stack traces in production UI.
5. **Accessible by default.** Keyboard, screen reader, reduced motion — inclusive from component spec, not retrofitted.
6. **Tablet-first, desktop-capable.** Touch targets, font sizes, and layout optimize for tablet use on the warehouse floor. Desktop expands the canvas for managers.
