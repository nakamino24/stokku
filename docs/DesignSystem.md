# Design System

## Foundations

### Color Palette
- **Primary**: 
  - Blue-500: #3B82F6 (main brand)
  - Blue-600: #2563EB (hover/active)
  - Blue-700: #1D4ED8 (pressed)
- **Secondary**:
  - Purple-500: #8B5CF6 (accents, highlights)
  - Purple-600: #7C3AED
- **Neutrals**:
  - Gray-50: #F9FAFB
  - Gray-100: #F3F4F6
  - Gray-200: #E5E7EB
  - Gray-300: #D1D5DB
  - Gray-400: #9CA3AF
  - Gray-500: #6B7280
  - Gray-600: #4B5563
  - Gray-700: #374151
  - Gray-800: #1F2937
  - Gray-900: #111827
- **Semantic**:
  - Success: #10B981 (green-500)
  - Warning: #F59E0B (amber-500)
  - Error: #EF4444 (red-500)
  - Info: #3B82F6 (blue-500)
- **Dark Mode**:
  - Invert neutrals: Gray-900 becomes background, Gray-50 becomes text
  - Primary/secondary: Lighten 20% for dark background contrast
  - Semantic: Maintain 4.5:1 contrast ratio

### Typography
- **Font Family**: Inter (system UI: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Font Sizes** (base 16px):
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)
  - 4xl: 2.25rem (36px)
  - 5xl: 3rem (48px)
- **Line Heights**:
  - Tight: 1.25
  - Snug: 1.375
  - Normal: 1.5
  - Relaxed: 1.625
- **Letter Tracking**:
  - Tighter: -0.05em
  - Normal: 0
  - Wide: 0.05em

### Spacing System (4px grid)
- 0: 0px
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 7: 1.75rem (28px)
- 8: 2rem (32px)
- 9: 2.25rem (36px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)
- 20: 5rem (80px)
- 24: 6rem (96px)
- 28: 7rem (112px)
- 32: 8rem (128px)

### Border Radius
- None: 0px
- Sm: 0.125rem (2px)
- Default: 0.25rem (4px)
- Md: 0.375rem (6px)
- Lg: 0.5rem (8px)
- Xl: 0.75rem (12px)
- 2xl: 1rem (16px)
- 3xl: 1.5rem (24px)
- Full: 9999px

### Shadows (Elevation)
- Sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- Base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
- Md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- Lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- Xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
- 2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- Inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)

### Transitions & Animation
- **Duration**:
  - Fast: 100ms
  - Normal: 150ms
  - Slow: 200ms
  - Slower: 250ms
- **Easing**:
  - Ease-in: cubic-bezier(0.4, 0, 1, 1)
  - Ease-out: cubic-bezier(0, 0, 0.2, 1)
  - Ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
  - Standard: cubic-bezier(0.4, 0, 0.2, 1) (same as ease-in-out)
- **Properties**:
  - Opacity, transform, color, background-color, border-color, box-shadow, filter, width, height

### Icon System
- **Style**: Outline (2px stroke) for primary, filled for accents
- **Size**: 16px, 20px, 24px, 32px
- **Color**: CurrentColor for inheritance
- **Set**: Custom icons for product-specific actions, Heroicons for generic
- **Usage**: Inline SVG for styling control, sprite sheet for performance

### Imagery Style
- **Illustrations**: Line art with single accent color (primary blue), flat colors for fills
- **Photography**: Slight desaturation, warm tone, focus on people collaborating
- **Icons**: Consistent stroke weight, geometric shapes, clear metaphors
- **Avatars**: Circular, border for online status, initials fallback

### Voice & Tone
- **Voice**: Clear, concise, helpful, slightly professional but friendly
- **Tone**: 
  - Empty states: Encouraging, helpful
  - Error messages: Apologetic, solution-oriented
  - Success messages: Celebratory, concise
  - Onboarding: Welcoming, educational
  - Error states: Clear, actionable, non-technical language

## Component Guidelines

### Buttons
- **Variants**: Primary (solid), Secondary (outline), Ghost (text), Danger (red), Link
- **Sizes**: Sm (24px h), Base (32px h), Lg (40px h)
- **States**: Default, hover, focus, active, disabled, loading
- **Icon**: Left or right, 8px spacing
- **Loading**: Spinner inside button, disabled state during load
- **Accessibility**: Minimum 44x44px touch target, clear focus ring

### Inputs & Forms
- **Fields**: Text, textarea, select, checkbox, radio, switch, datepicker, file upload
- **States**: Default, focus, error, success, disabled, read-only
- **Validation**: Inline validation on blur, error message below field
- **Layout**: Stacked (mobile), inline (desktop for short fields)
- **Spacing**: 4px between label and input, 8px between field and helper/error
- **Password**: Toggle visibility icon
- **Select**: Custom dropdown with search for >5 options
- **File Upload**: Drag-and-drop area, file preview, size limit indicator

### Navigation
- **Sidebar**: 
  - Width: 240px (collapsible to 64px icon-only)
  - Background: White/Gray-50 (dark: Gray-800)
  - Active item: Blue-500 background, blue text
  - Hover: Gray-100 background (dark: Gray-700)
  - Divider: Gray-200 (dark: Gray-700)
- **Topbar**:
  - Height: 64px
  - Background: White (dark: Gray-800)
  - Elevation: Base shadow
  - Content: Logo, search, notifications, user menu
- **Breadcrumb**:
  - Font: Sm, Gray-500
  - Separator: "/" or ">"
  - Active: Gray-900, font-medium
- **Tabs**:
  - Horizontal: Border-bottom, active underline (primary color)
  - Vertical: Border-right, active background (Gray-50)
  - Active state: Font-medium, primary color text
  - Disabled: Gray-400 text

### Cards & Containers
- **Card**:
  - Background: White (dark: Gray-800)
  - Border: 1px solid Gray-200 (dark: Gray-700)
  - Radius: Md
  - Shadow: Base
  - Padding: 6 (24px)
  - Header: Border-bottom (Gray-200), padding 4-6
  - Body: Padding 6
  - Footer: Border-top (Gray-200), padding 4-6
- **Panel**: Same as card but no border, shadow only
- **Accordion**: 
  - Header: Padding 5, hover background Gray-50
  - Active: Border-bottom none, active icon rotate
  - Content: Padding 0-5-5
- **Tabs Container**: Border-bottom (Gray-200), active tab underline

### Data Display
- **Table**:
  - Header: Background Gray-50, bold text, border-bottom (Gray-200)
  - Body: Alternating row background Gray-50 (hover), border-bottom (Gray-200)
  - Cell: Padding 4-6
  - Sticky header: On scroll
  - Sortable: Sort indicator (up/down arrow) in header
  - Selectable: Checkbox column, row highlight on select
  - Empty state: Illustration + message
- **List**:
  - Item: Padding 4-6, border-bottom (Gray-200)
  - Hover: Background Gray-50
  - Active: Background Blue-50, left border (Blue-500)
  - Divider: Optional Gray-200 between sections
  - Avatar: Left-aligned with text
  - Actions: Right-aligned, icon buttons
- **Stats/Card**:
  - Stat number: 2xl font-bold, primary color
  - Label: sm, Gray-500
  - Trend: Up (green-500), down (red-500), flat (Gray-500)
  - Sparkline: Mini line chart background

### Feedback Components
- **Toast**:
  - Position: Top-right (desktop), bottom-center (mobile)
  - Background: White (dark: Gray-800), shadow-xl
  - Progress bar: Bottom 2px, color based on type
  - Duration: 5000ms default, hover to pause
  - Action button: Text link, underline on hover
- **Tooltip**:
  - Background: Gray-900 (dark: Gray-50)
  - Text: White (dark: Gray-900), xs size
  - Arrow: 4px, same background
  - Delay: 100ms show, 100ms hide
  - Max-width: 200px
- **Modal**:
  - Backdrop: Black 50% opacity
  - Panel: White (dark: Gray-800), shadow-2xl, rounded-lg
  - Padding: 6
  - Header: Border-bottom (Gray-200), flex justify-between
  - Body: Space-y-6
  - Footer: Border-top (Gray-200), flex justify-end, space-x-3
  - Animation: Scale-fade-in (100ms), fade-out (150ms)
- **Dropdown Menu**:
  - Background: White (dark: Gray-800), shadow-lg
  - Padding: 2
  - Item: Flex items-center, px-3 py-2, rounded-md
  - Hover: Background Gray-100 (dark: Gray-700)
  - Active: Background Blue-100, text Blue-800
  - Divider: Height 1px, background Gray-200 (dark: Gray-700)
  - Icon: Left, 4px spacing
  - Arrow: Pointing up from anchor

### Navigation Patterns
- **Primary Navigation**: Persistent sidebar (collapsible) + topbar
- **Secondary Navigation**: Tabs (horizontal/vertical) or secondary sidebar
- **Breadcrumb**: For deep nesting (>2 levels)
- **Pagination**: 
  - Previous/Next buttons
  - Page numbers (show current, ±2 neighbors)
  - First/last with ellipsis
  - Page size selector
- **Steps/Wizard**:
  - Horizontal steps with numbers
  - Vertical steps with icons
  - Progress bar alternative
  - Validation per step before next

## Accessibility Specifications
- **Color Contrast**: 
  - Text: Minimum 4.5:1 (AA), 7:1 (AAA) for large text
  - UI components: 3:1 for meaningful icons, borders, states
  - Disabled: 4.5:1 on background (but may be lower if not actionable)
- **Typography**:
  - Base font size: 16px (rem units for scalability)
  - Line length: 45-75 characters for readability
  - Avoid all caps for body text
  - Use semantic HTML (h1-h6, p, button, etc.)
- **Interaction**:
  - Touch target: Minimum 44x44px
  - Keyboard navigation: Logical tab order, visible focus outline (2px solid, offset 2px)
  - Skip links: At page top to main content
  - ARIA labels: For icons, complex widgets
  - Live regions: For dynamic content (toasts, updates)
  - Reduced motion: Respect prefers-reduced-media, disable non-essential animations
- **Forms**:
  - Explicit labels (for/id or aria-label)
  - Error messaging: Associated via aria-describedb
  - Required indicators: Asterisk + aria-required="true"
  - Input types: Correct for mobile keyboards (email, tel, number)
  - Autocomplete attributes: For password managers
- **Screen Reader**:
  - Landmark roles: header, nav, main, complementary, footer
  - Heading hierarchy: No skipping levels
  - List markup: ul/ol for groups of items
  - Table scope: col/row for headers
  - Alt text: For meaningful images, empty for decorative

## Dark Mode Specification
- **Activation**: 
  - System preference (prefers-color-scheme: dark)
  - Manual toggle (persists in localStorage)
  - Site-wide override (for specific pages)
- **Color Mapping**:
  - Background: Gray-900 → Gray-50 (inverted)
  - Surface: Gray-800 → Gray-100
  - Border: Gray-700 → Gray-200
  - Text Primary: Gray-50 → Gray-900
  - Text Secondary: Gray-300 → Gray-400
  - Primary: Blue-500 → Blue-400 (lighter for contrast)
  - Secondary: Purple-500 → Purple-400
  - Success: Green-500 → Green-400
  - Warning: Amber-500 → Amber-400
  - Error: Red-500 → Red-400
- **Elevation**: Shadows adjusted for dark background (lighter, more spread)
- **Images**: 
  - Prefer SVG with currentColor for icons
  - For raster images, use CSS filter: brightness(0.9) contrast(1.1) or serve dark variant
- **Transitions**: Same durations, consider slightly faster for dark mode perception

## Implementation Guidelines
### CSS-in-JS (Recommended: Tailwind CSS)
- **Configuration**: Extend theme with above values
- **Prefix**: Use `tw-` or configure prefix to avoid conflicts
- **Dark Mode**: Use `dark:` variant
- **Utilities**: Leverage @apply for component styles
- **JIT**: Enable for development speed
- **Purging**: Configure for production build

### Component Architecture (Framework Agnostic)
- **Atoms**: Button, Input, Label, Icon, Avatar, Badge, Tag, Spinner
- **Molecules**: FormField, Card, BadgeBadge, InputGroup, MenuItem
- **Organisms**: NavigationSidebar, HeaderBar, CardList, Table, Modal, ToastContainer
- **Templates**: PageLayout, DashboardLayout, SettingsLayout
- **Pages**: Specific route implementations

### Documentation & Usage
- **Storybook**: For component development and testing
- **Figma**: Design tokens and components mirrored
- **Versioning**: Semantic versioning for breaking changes
- **Changelog**: Document all changes
- **Linting**: Stylelint for CSS/SCSS, eslint for JS/TS
- **Testing**: 
  - Visual regression: Chromatic
  - Unit: Jest + React Testing Library
  - Accessibility: axe-core
- **Performance**:
  - Bundle analysis: webpack-bundle-analyzer
  - Lazy loading: Suspense + lazy
  - Code splitting: Route-based
  - Critical CSS: Extract for above-fold

## Naming Conventions
- **Classes**: kebab-case (Tailwind utility-first)
- **Components**: PascalCase (ButtonPrimary, FormInput)
- **Variables**: camelCase (isLoading, userCount)
- **Constants**: UPPER_SNAKE_CASE (MAX_ITEMS, API_URL)
- **Events**: camelCase (onClick, onChange)
- **Files**: 
  - Components: Button.tsx
  - Styles: button.module.css or button.ts (for styled-components)
  - Stories: Button.stories.tsx
  - Tests: Button.test.tsx

## Future Considerations
- **Theming**: Multiple themes (brand, high contrast, sepia)
- **Internationalization**: RTL support, locale-specific formatting
- **Motion Design**: More sophisticated animations (spring physics)
- **Data Visualization**: Charting library integration (Recharts, Victory)
- **Advanced Components**: Virtualized lists, drag-and-drop kits, WYSIWYG editor
- **Platform Specific**: Native mobile components (React Native), desktop (Electron/Tauri)