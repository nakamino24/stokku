# Component Architecture

**Status:** Phase 3 — ready for implementation
**Dependency:** Design System Specification (`design-system.md`)

---

## 1. Package Structure

```
packages/ui/src/
  components/
    primitives/
      Button/
      Input/
      Select/
      Checkbox/
      Badge/
      Text/
      Separator/
      Spinner/
      Skeleton/
    feedback/
      Alert/
      Toast/
      EmptyState/
      ErrorBoundary/
      InlineError/
    data/
      DataTable/
      StatusBadge/
      FilterBar/
      Pagination/
      QuantityCell/
    workflow/
      TaskHeader/
      LocationBreadcrumb/
      StepProgress/
      ScanField/
      ExceptionPanel/
      ConfirmationDialog/
    layout/
      AppShell/
      Sidebar/
      BottomNav/
      Modal/
      Drawer/
  hooks/
    useDebounce.ts
    useKeyboardShortcut.ts
    useMediaQuery.ts
    useReducedMotion.ts
    useScanInput.ts
    useToast.ts
    useConfirm.ts
  utils/
    cn.ts
    formatQuantity.ts
    formatDateTime.ts
    formatDocumentNumber.ts
    validateBarcode.ts
  styles/
    tokens.css
    globals.css
  index.ts
```

### 1.1 Component File Convention

Each component directory exposes via its `index.ts`:

```
Button/
  Button.tsx         — component implementation
  Button.test.tsx    — unit tests (render, states, accessibility)
  Button.stories.tsx — visual regression / playground (optional, future)
  index.ts           — re-export
```

Components that compose other UI components import from `@stokku/ui`, never from relative paths into sibling component files. Feature modules import from `@stokku/ui` only — they never import directly from `packages/ui/src`.

---

## 2. Component Hierarchy & Composition Rules

```
Layout
  ├── AppShell
  │   ├── Sidebar          (navigation, organization switcher)
  │   ├── TopBar           (breadcrumb, search, notifications, user menu)
  │   └── <main>           (route content)
  │       ├── PageHeader   (title, actions, metadata)
  │       ├── DataTable    (tabular data with sort/filter/paginate)
  │       │   ├── StatusBadge
  │       │   ├── QuantityCell
  │       │   ├── Badge
  │       │   └── Pagination
  │       ├── TaskCard     (mobile alternative for DataTable)
  │       └── FilterBar
  │           ├── Input (search)
  │           ├── Select (dropdown filters)
  │           ├── DateRangePicker
  │           └── Badge (active filter chips)
  └── MobileTaskShell
      ├── TaskHeader
      ├── ScanField
      ├── LocationBreadcrumb
      ├── StepProgress
      ├── QuantityConfirm
      ├── ExceptionPanel
      └── ConfirmationDialog
```

### 2.1 Composition constraints

| Rule | Description |
|------|-------------|
| **Feature → UI only** | Feature modules import from `@stokku/ui`. No feature module imports from `packages/ui/src/components/*` directly. |
| **UI → UI only** | UI components may compose other UI components (e.g. `DataTable` uses `Skeleton`, `Badge`, `Pagination`). |
| **UI → no feature code** | UI components never import from `@stokku/domain`, `@stokku/api`, or feature modules. |
| **No parallel conventions** | If a feature needs a table, it uses `DataTable`. If it needs a button, it uses `Button`. No feature-specific button/table/error component. |
| **Exceptions** | Exception components (`ExceptionPanel`, `ErrorBoundary`) live in `@stokku/ui` and are consumed by features. |

---

## 3. Data Flow

### 3.1 Page / Feature Module Pattern

```
Page (route file in apps/web/pages/)
  ├── useQuery / useMutation (via SWR or React Query)
  ├── Transforms API response → domain types (if needed)
  ├── Renders:
  │   ├── <PageHeader />
  │   ├── conditionally:
  │   │   ├── <Skeleton variant="table" />  ← loading
  │   │   ├── <EmptyState />                ← empty
  │   │   ├── <ErrorBoundary />             ← error
  │   │   └── <DataTable />                 ← data
  │   └── <Pagination />
  └── Returns JSX (no side effects in render)
```

### 3.2 Workflow Mutation Pattern

```
Operator action
  → Optimistic UI update (if reversible local state)
  → API call (mutation)
  → Success: invalidate SWR cache → real data replaces optimistic state
  → Error: revert optimistic state + show error toast
  → Confirmation: success toast with next-action link
```

Inventory mutations NEVER use optimistic updates. They wait for server commit and render the server response.

### 3.3 State Management

| State Type | Strategy |
|------------|----------|
| Server state (lists, entities) | SWR cache, keyed by API path + params |
| Form state | React Hook Form |
| UI state (modals open, sidebar) | `useState` local to component tree |
| Auth state | `AuthContext` (React Context), observed by layout |
| Theme | `ThemeContext` with `localStorage` persistence |
| Toast queue | `ToastProvider` (Context) |

No global state library (Redux, Zustand). The data flow is simple enough for SWR + Context.

---

## 4. Responsive Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `< 640px` | Phone | BottomNav, full-width modals, card list instead of table |
| `640 - 1023px` | Tablet | Collapsible sidebar (icon-only), table with horizontal scroll |
| `>= 1024px` | Desktop | Expanded sidebar, full table, split-pane detail panels |
| `>= 1440px` | Wide | Maximum content width 1280px centered |

## 5. Dark Mode Strategy

Dark mode is controlled by a `data-theme` attribute on `<html>`:

```css
[data-theme='dark'] {
  /* Components use CSS variables; they do not check for dark mode logically */
}
```

- Toggle button in user menu
- Persisted to `localStorage`
- Default: system preference (`prefers-color-scheme`)
- All components use `--color-*` variables. No component has a `darkMode` prop.

## 6. Loading States by Component

| Component | Loading Behavior |
|-----------|-----------------|
| DataTable | Shows `Skeleton` rows (3-5) matching column count |
| Detail card | Single `Skeleton` card |
| Dashboard KPI | Number skeleton (small rectangle) |
| Form submit | Button shows `loading` prop, form fields stay editable |
| ScanField | Auto-focus, no loading state (scan is always ready) |

## 7. Accessibility Compliance

Every component must pass:

1. **Rendered HTML** uses semantic elements (`<button>`, `<nav>`, `<table>`, etc.)
2. **ARIA attributes** where semantic HTML is insufficient (`aria-label`, `aria-describedby`, `aria-expanded`)
3. **Keyboard operation** – all interactive elements reachable and operable by keyboard
4. **Focus management** – dialogs trap focus, page content focuses heading on navigation
5. **Color contrast** – all text/background combinations meet WCAG 2.2 AA
6. **Reduced motion** – `prefers-reduced-motion: reduce` disables nonessential animations
7. **Screen reader** – live regions for dynamic content, proper heading hierarchy

These are enforced via automated tests (`jest-axe` or similar) and manual review.