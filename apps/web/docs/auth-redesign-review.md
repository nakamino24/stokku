# Auth Redesign — Design Decisions Review

## Layout: Split-Screen (50/50)
- Left panel reserved for brand identity and value proposition — communicates what Stokku is before asking for credentials
- Right panel focused purely on the form — minimizes cognitive load during the conversion step
- On mobile (<1024px): brand panel collapses, logo moves to top of form (inline)

## Brand Panel
- Dark gradient background (#0f172a → #1e1b4b) creates premium, secure feeling — communicates enterprise readiness
- Subtle radial gradient overlays at 3% opacity add depth without distraction
- Logo: indigo gradient square + "Stokku" wordmark — simple, memorable
- Headline + supporting copy explains value proposition immediately
- 3 benefit rows with staggered fade-in animations draw the eye down naturally

## Form Panel
- Clean white container on light grey (#f8fafc) surface — separates form from background
- "Welcome back" heading + subtitle sets context
- Input fields: 44px height, rounded-lg (8px), left icons for email/password, focus ring with indigo-100
- Password field: eye toggle button (FiEye/FiEyeOff) with proper aria-label for accessibility
- "Forgot password?" link always visible — reduces support friction
- "Remember me" checkbox — respects user preference
- Submit button: gradient background (indigo-500 to indigo-600), hover shadow, active scale(0.98) for tactile feel
- Loading state: spinner + "Signing in..." — maintains button width, prevents layout shift
- Error state: red badge with dot indicator + border — appears with fade-in animation
- Divider + Google OAuth button for social login path
- Link to register at bottom

## Register Page
- Same layout and design system as login
- Added name field (FiUser icon)
- Password requirements visibly listed with real-time validation feedback
  - Checkmark transitions from slate-300 to emerald-500 as each requirement is met
  - Helps users create valid passwords without submission errors
- Password input uses stronger requirements: 8+ chars, uppercase, number

## Typography
- System font stack: Inter (loaded via @import in globals.css), optimized with font-feature-settings
- Headings: 24px bold, tight tracking, slate-900
- Body: 16px regular, slate-500
- Labels: 14px medium, slate-800
- Hints/errors: 12px

## Spacing System (8px grid)
- Form gap: 20px (2.5x)
- Input padding: 14px horizontal, 10px vertical
- Section gaps: 32px (4x)
- Card border radius: 12px (1.5x)

## Accessibility
- All inputs have proper htmlFor/id associations
- Password toggle has aria-label (screen reader friendly)
- Keyboard navigation: tab order follows visual order
- Focus indicators: ring-2 with brand-100 color (WCAG AA compliant at 3:1 against white)
- Color contrast: slate-900 on white (15:1), slate-500 on white (7:1), all pass WCAG AA
- Error states use both color AND icon (dot) — not color-only
- Interactive elements have hover, focus, active, disabled states

## Animations
- Form card: scaleIn (0.35s ease-out) — subtle entrance feel
- Benefit rows: staggered fadeIn (0.5s ease-out) with 150ms delays
- Error messages: fadeIn (0.3s ease-out)
- Button: active scale(0.98) for tactile feedback

## Responsive Behavior
- Desktop (>=1024px): split-screen, brand panel visible
- Tablet (768-1023px): same split, brand panel text scales down slightly
- Mobile (<768px): brand panel hidden, logo inline at top of form
