# Component Architecture

## Overview
Component-based architecture following Atomic Design principles (Atoms, Molecules, Organisms, Templates, Pages) for scalability, reusability, and maintainability.

## Design Principles
- **Single Responsibility**: Each component does one thing well
- **Composition over Inheritance**: Build complex components from simpler ones
- **Props Driven**: Configure behavior through props, not internal state when possible
- **Encapsulation**: Components manage their own state and side effects
- **Performance**: Memoize expensive computations, lazy load when beneficial
- **Accessibility**: Built-in ARIA labels, keyboard navigation, focus management
- **Testability**: Separate concerns, pure functions where possible
- **Theming**: Respect design tokens, support dark mode

## Folder Structure
```
components/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.types.ts
│   │   └── Button.styles.ts
│   ├── Input/
│   ├── Icon/
│   ├── Avatar/
│   ├── Badge/
│   ├── Tag/
│   ├── Label/
│   ├── Spinner/
│   ├── Checkbox/
│   ├── Radio/
│   ├── Switch/
│   └── ...
├── molecules/
│   ├── FormField/
│   ├── InputGroup/
│   ├── Card/
│   ├── BadgeBadge/
│   ├── MenuItem/
│   ├── TableCell/
│   ├── CommentThread/
│   ├── TaskItem/
│   ├── AvatarGroup/
│   ├── StatCard/
│   └── ...
├── organisms/
│   ├── NavigationSidebar/
│   ├── HeaderBar/
│   ├── ProjectBoard/
│   ├── TaskList/
│   ├── CommentSection/
│   ├── FormModal/
│   ├── DropdownMenu/
│   ├── DatePicker/
│   ├── FileUploader/
│   ├── SearchBar/
│   ├── Pagination/
│   ├── Tabs/
│   ├── Accordion/
│   ├── ToastContainer/
│   └── ...
├── templates/
│   ├── DashboardLayout/
│   ├── ProjectLayout/
│   ├── SettingsLayout/
│   ├── AuthLayout/
│   └── ...
└── index.ts (barrel exports)
```

## Component Guidelines

### Atoms
**Button** (`Button.tsx`)
- Props: 
  - variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  - size: 'sm' | 'md' | 'lg'
  - disabled: boolean
  - loading: boolean
  - icon: React.ReactNode (left/right)
  - onClick: () => void
  - children: React.ReactNode
- States: idle, hover, focus, active, disabled, loading
- Accessibility: 
  - Native button element
  - Accessible name (aria-label or visible text)
  - Focus ring (2px solid, offset 2px)
  - Keyboard activation (Enter/Space)

**Input** (`Input.tsx`)
- Props:
  - type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  - label: string
  - value: string
  - onChange: (value: string) => void
  - placeholder?: string
  - disabled?: boolean
  - error?: string
  - success?: boolean
  - iconLeft?: React.ReactNode
  - iconRight?: React.ReactNode
- Features:
  - Label with htmlFor
  - Inline validation (error/success)
  - Password toggle (for type='password')
  - Clearable (for text/search)
  - Autocomplete attribute
- Validation:
  - Required: required attribute
  - Pattern: pattern attribute
  - Type-specific: email, url, etc.
  - Custom: via onBlur/onChange validation

**Icon** (`Icon.tsx`)
- Props:
  - name: string (icon identifier)
  - size: number (px) or 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  - color: string (CSS color or 'currentColor')
  - title?: string (for accessibility)
  - strokeWidth?: number
- Implementation:
  - Inline SVG for styling control
  - Sprite sheet option for performance
  - aria-hidden="true" by default (unless title provided)
  - CurrentColor for inheritance

### Molecules
**FormField** (`FormField.tsx`)
- Combines Label, Input, and validation message
- Props:
  - label: string
  - id: string (for htmlFor)
  - children: React.ReactNode (input component)
  - error?: string
  - success?: boolean
  - required?: boolean
  - helperText?: string
- Layout:
  - Label on top (or inline for horizontal forms)
  - Input full width
  - Error message below (red)
  - Success indicator (green checkmark)
  - Helper text (muted)

**Card** (`Card.tsx`)
- Props:
  - title?: string
  - children: React.ReactNode
  - bordered?: boolean (default: true)
  - elevated?: boolean (default: true)
  - padding: number (default: 6 - 24px)
  - headerClassName?: string
  - bodyClassName?: string
  - footerClassName?: string
- Structure:
  - Optional header with border-bottom
  - Body with padding
  - Optional footer with border-top
  - Consistent border radius and shadow
  - Background: white (dark: gray-800)

**StatCard** (`StatCard.tsx`)
- Props:
  - title: string
  - value: string | number
  - trend?: 'up' | 'down' | 'neutral'
  - trendValue?: number (percentage)
  - icon?: React.ReactNode
  - color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
- Layout:
  - Icon (optional) + title (top)
  - Value (large, prominent)
  - Trend indicator (small, colored)
  - Compact vertical stacking

**CommentThread** (`CommentThread.tsx`)
- Props:
  - comments: Comment[]
  - onAddComment: (text: string) => Promise<void>
  - canEdit: boolean
  - canDelete: boolean
- Features:
  - List of comments with avatar, timestamp, content
  - Threaded replies (indented)
  - Edit/delete controls (hover/tooltip)
  - Add comment form at bottom
  - Loading and empty states
  - Markdown or rich text support (configurable)

### Organisms
**NavigationSidebar** (`NavigationSidebar.tsx`)
- Props:
  - items: NavItem[]
  - collapsed: boolean
  - onToggleCollapse: () => void
  - workspaceId: string
- Features:
  - Collapsible to icon-only mode (64px width)
  - Scrollable content
  - Active item highlighting
  - Section headers and dividers
  - Drag-and-drop reordering (for custom sections)
  - Contextual menus (right-click)
  - Responsive: hidden below breakpoint, accessible via drawer
  - Keyboard navigation: arrow keys, enter/space

**HeaderBar** (`HeaderBar.tsx`)
- Props:
  - title: string
  - actions: ActionItem[]
  - profile: UserData | null
  - notifications: Notification[]
  - onSearch: (query: string) => void
  - onNotificationClick: (id: string) => void
  - onProfileClick: () => void
- Features:
  - Fixed height (64px)
  - Left: logo/workspace switcher
  - Center: search bar (prominent on desktop)
  - Right: notifications, profile, actions
  - Elevation shadow
  - Responsive: collapses to hamburger on mobile
  - Accessible: label icons, keyboard navigation

**ProjectBoard** (`ProjectBoard.tsx`)
- Props:
  - projectId: string
  - columns: Column[] (to do, in progress, etc.)
  - tasks: Task[]
  - onDragStart: (taskId: string) => void
  - onDragEnd: (result: DropResult) => void
  - onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  - onAddTask: (columnId: string) => void
- Features:
  - Drag-and-drop (using @dnd-kit or similar)
  - Column limits (WIP limits)
  - Task cards with avatar initials, tags, due dates
  - Menu for each task (edit, duplicate, delete, etc.)
  - Empty state per column
  - Add card button at column bottom
  - Responsive: stacks vertically on narrow screens
  - Performance: virtualized lists for large columns

**TaskList** (`TaskList.tsx`)
- Props:
  - tasks: Task[]
  - columns: Column[] (for grouping)
  - groupBy: 'status' | 'assignee' | 'tag' | 'none'
  - sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title'
  - filters: Filter[]
  - onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  - onDeleteTask: (taskId: string) => void
- Features:
  - Multiple views: list, board, calendar, timeline
  - Inline editing (click to edit)
  - Bulk selection (checkboxes)
  - Row actions menu
  - Keyboard navigation (up/down/enter)
  - Select all checkbox
  - Empty state with illustration
  - Loading skeleton
  - Virtualized for performance

**FormModal** (`FormModal.tsx`)
- Props:
  - title: string
  - children: React.ReactNode
  - isOpen: boolean
  - onClose: () => void
  - onSubmit: (formData: any) => void
  - submitLabel: string
  - cancelLabel: string
  - width?: 'sm' | 'md' | 'lg' | 'full'
- Features:
  - Overlay backdrop (click to close)
  - Escape key to close
  - Focus trap
  - Animated entrance (scale-fade)
  - Form validation integration
  - Submit button disabled during validation
  - Responsive: fullscreen on mobile, centered on desktop
  - Header with close button (X)

**DropdownMenu** (`DropdownMenu.tsx`)
- Props:
  - anchorEl: HTMLElement | null (for positioning)
  - items: MenuItem[]
  - onClose: () => void
  - direction: 'down' | 'up' | 'left' | 'right'
  - alignment: 'start' | 'center' | 'end'
- Features:
  - Portal rendering (append to body)
  - Click outside to close
  - Escape key to close
  - Keyboard navigation (arrow keys, enter/space)
  - Icons and dividers in items
  - Submenus (nested)
  - Position awareness (viewport boundaries)
  - Highlighted selected item

### Templates
**DashboardLayout** (`DashboardLayout.tsx`)
- Structure:
  - HeaderBar (fixed top)
  - NavigationSidebar (fixed left, collapsible)
  - MainContent (flexible, fills remaining space)
  - Optional footer
- Features:
  - Responsive sidebar (collapsible/hidden)
  - ToastContainer positioned top-right
  - Modal container (centered)
  - Loading spinner overlay
  - Error boundary fallback
  - Route-based layout switching

**ProjectLayout** (`ProjectLayout.tsx`)
- Similar to DashboardLayout but with:
  - Project breadcrumb instead of workspace switcher
  - Secondary navigation (tabs for views: board, list, calendar, etc.)
  - Project-specific actions in header

### Pages
**HomePage** (`pages/Home.tsx`)
- Uses DashboardLayout
- Shows workspace overview, recent activity, quick stats
- Entry point after login

**ProjectPage** (`pages/Project/[id].tsx`)
- Uses ProjectLayout
- Route-dependent view (board/list/calendar/timeline)
- Project header with actions

**SettingsPage** (`pages/Settings.tsx`)
- Uses SettingsLayout
- Sections: General, Members, Integrations, Notifications, Billing

**AuthPage** (`pages/Auth.tsx`)
- Uses AuthLayout (minimal header/footer)
- Login, signup, password reset flows

## State Management
- **Server State**: React Query / TanStack Query
  - Caching, deduplication, background updates
  - Optimistic updates for mutations
  - Pagination and infinite queries
- **Client State**: Zustand or Jotai (lightweight) or Context API
  - UI state: sidebar collapsed, modal open, active tab
  - Form state: validation, touched fields
  - User preferences: theme, timezone, date format
- **Avoid**: Redux for simplicity unless complex middleware needed

## Styling Approach
- **Primary**: Tailwind CSS (utility-first)
  - JIT mode for development
  - PurgeCSS for production
  - Custom theme extension (design tokens)
  - Dark mode via `dark:` variant
- **Component Scoping**: 
  - Optional: CSS Modules for component-specific overrides
  - Avoid global CSS except for base styles
- **Dark Mode**: 
  - CSS variables for colors (optional)
  - Tailwind dark mode strategy: class-based on html element
- **CSS-in-JS Alternative**: 
  - Emotion or Styled Components if needed for complex theming
  - But prefer Tailwind for simplicity and performance

## Performance Optimizations
- **Code Splitting**:
  - Route-based splitting (React.lazy + Suspense)
  - Component-based for large libraries (charts, editors)
- **Lazy Loading**:
  - Images: loading="lazy" + blur-up placeholder
  - Components: dynamic import for non-critical paths
- **Memoization**:
  - React.memo for pure components
  - useMemo for expensive calculations
  - useCallback for event handlers passed down
- **Virtualization**:
  - react-window or react-virtualized for long lists
  - Applied to: task lists, comment threads, activity feeds
- **Bundle Analysis**:
  - webpack-bundle-analyzer or @next/bundle-analyzer
  - Target: <100KB gzipped JS for initial load
- **Asset Optimization**:
  - SVGs as React components (or inline)
  - Images: WebP/AVIF, responsive srcset
  - Fonts: subsetted, preload critical weights

## Accessibility Implementation
- **Focus Management**:
  - Trap focus in modals/drawers
  - Return focus to trigger on close
  - Skip links at page top
  - Logical tab order
- **ARIA Attributes**:
  - Labels: aria-label, aria-labelledby
  - Described by: aria-describedb (for errors)
  - Live regions: aria-live="polite" for toasts
  - Roles: button, checkbox, radio, etc. (when not using native)
  - Expanded/collapsed: aria-expanded
  - Selected: aria-selected
- **Keyboard Navigation**:
  - All interactive elements reachable via Tab
  - Custom widgets follow ARIA authoring practices
  - Arrow keys for grids, menus, tabs
  - Enter/Space for activation
- **Screen Reader Testing**:
  - Use actual screen readers (NVDA, VoiceOver)
  - Test with browser accessibility tools
- **Color and Contrast**:
  - Follow design token contrast ratios
  - Test with contrast checkers
  - Do not rely on color alone for meaning
- **Reduced Motion**:
  - Respect prefers-reduced-media
  - Disable non-essential animations
  - Use motion-safe variants

## Testing Strategy
- **Unit Tests**:
  - Jest + React Testing Library
  - Test component props, state changes, events
  - Mock API calls, focus on user interactions
- **Snapshot Testing**:
  - Jest snapshots for UI regression
  - Use sparingly, prefer behavioral tests
- **Accessibility Tests**:
  - jest-axe for automated a11y checks
  - Manual screen reader testing
- **Visual Regression**:
  - Storybook + Chromatic
  - Test across breakpoints and themes
- **End-to-End**:
  - Cypress or Playwright
  - Critical user flows: login, create task, comment
- **Test Coverage Goal**: 80%+ for critical paths

## Documentation and Storybook
- **Storybook**:
  - Each component has stories for states/variants
  - Docs page with props table and usage examples
  - Accessibility toolbar addon
  - Controls for interactive testing
- **Documentation**:
  - JSDoc for TypeScript components
  - README per component folder with usage notes
  - Design system website (Storybook as docs)
- **Component Library**:
  - Versioned package (if extracted)
  - Changelog for breaking changes
  - Peer dependencies: React, React DOM

## Future Considerations
- **Design Tokens**: Extract to separate package for cross-platform
- **Theming System**: Support multiple themes (brand, high contrast)
- **Component Variants**: Compound variants for complex styling
- **Server Components**: React Server Components for data fetching
- **Edge Functions**: Move validation/computation to edge
- **Accessibility**: Automated axe-core in CI
- **Performance**: Core Web Vitals monitoring in production
- **Internationalization**: RTL support, locale-specific components
- **Platform Adaptation**: Adaptive components for mobile/web/desktop