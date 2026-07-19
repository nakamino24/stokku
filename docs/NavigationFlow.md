# Navigation Flow

## Overview
Define how users move through the application, including main navigation, contextual navigation, and deep linking.

## Information Architecture
```
Home (Dashboard)
├── Projects (List)
│   ├── Project Overview
│   │   ├── Board View (Kanban)
│   │   ├── List View
│   │   ├── Calendar View
│   │   └── Timeline/Gantt View
│   ├── Project Settings
│   │   ├── General
│   │   ├── Members
│   │   ├── Integrations
│   │   └── Notifications
│   └── Project Actions
│       ├── Export
│       ├── Duplicate
│       └── Archive
├── Task Detail (Modal/Sidebar)
│   ├── Activity
│   ├── Subtasks
│   ├── Attachments
│   └── Comments
├── Search Results
│   ├── Global Search
│   └── Filters Applied
├── Notifications
│   ├── All Notifications
│   └── Notification Settings
├── User Profile
│   ├── Profile Settings
│   ├── Account Settings
│   └── Billing (if applicable)
└── Workspace Settings
    ├── General
    ├── Members & Permissions
    ├── Integrations
    ├── Notifications
    └── Advanced
```

## Navigation Types

### 1. Primary Navigation (Persistent)
Located in the Sidebar (collapsible) and accessible via hamburger on mobile.

**Items:**
- Dashboard (Home) - `/`
- Projects - `/projects`
- Calendar - `/calendar` (global view)
- Team / People - `/team`
- Reports - `/reports` (future)
- Settings - `/settings`

**Behavior:**
- Always visible on desktop (collapsible to icons)
- Hidden on mobile, accessible via drawer (swipe from left or hamburger menu)
- Current item highlighted
- Tooltip labels on hover/icon-only mode

### 2. Secondary Navigation (Contextual)
Appears within specific contexts, usually below the header.

**Examples:**
- **Project View**: Tabs for Board, List, Calendar, Timeline
- **Settings**: Sub-navigation for General, Members, Integrations, etc.
- **User Profile**: Tabs for Profile, Account, Billing
- **Search Results**: Filters and sort options

**Behavior:**
- Horizontal tabs (scrollable if overflow)
- Mobile: bottom tab bar or convert to accordion
- Active tab highlighted with indicator
- URL updates with query parameters or path

### 3. Breadcrumb Navigation
Shown when depth > 2 levels.

**Example:**
```
Home > Projects > Website Redesign > Task: Design homepage
```

**Behavior:**
- Clickable links except current item
- Separator: ">" or "/"
- Hidden on mobile to save space (replaced by back button in header)

### 4. Action-Based Navigation
Triggered by user actions, not persistent UI.

**Examples:**
- **Create New**: Floating Action Button (FAB) or "+ New" button
  - Projects: "+ New Project" → Project creation modal
  - Tasks: "+ New Task" → Task creation form (inline or modal)
- **Edit**: Inline edit or modal
- **View Details**: Click item → detail view
- **Cancel/Close**: "X" or "Cancel" button, Escape key

**Behavior:**
- Modal slides in from right (desktop) or bottom (mobile)
- Fullscreen on mobile for complex forms
- Backdrop click to close (configurable)
- Escape key to close

### 5. Deep Linking & URL Structure
Support direct linking to specific states.

**Patterns:**
- `/` → Dashboard
- `/projects` → Project list
- `/projects/:projectId` → Project overview (last viewed tab)
- `/projects/:projectId/board` → Board view explicitly
- `/projects/:projectId/list` → List view explicitly
- `/projects/:projectId/calendar` → Calendar view
- `/projects/:projectId/timeline` → Timeline view
- `/projects/:projectId/tasks/:taskId` → Task detail (sidebar/modal)
- `/search?q=term&status=done` → Search results
- `/notifications` → Notifications page
- `/settings` → Settings overview
- `/settings/members` → Members management
- `/profile` → User profile
- `/auth/login` → Login page
- `/auth/register` → Registration page
- `/auth/reset-password` → Password reset
- `/auth/verify-email` → Email verification

**Query Parameters:**
- `view`: board|list|calendar|timeline
- `status`: todo|in_progress|review|done
- `assignee`: userId|unassigned|me
- `priority`: low|medium|high|urgent
- `sort`: createdAt|dueDate|priority|title
- `order`: asc|desc
- `page`: number
- `limit`: number
- `search`: string
- `tags`: tag1,tag2,tag3

### 6. Navigation Events & Triggers

**User-Initiated:**
- Click navigation item → navigate to route
- Click button/link → open modal/perform action
- Submit form → navigate or show status
- Drag and drop → update state, may change view
- Keyboard shortcuts → navigate or trigger action

**System-Initiated:**
- Authentication redirect → /auth/login
- Permission denied → /unauthorized
- Session expired → redirect to login with message
- Feature flag disabled → show notice or redirect
- Error boundary → show error fallback

### 7. Mobile-Specific Navigation Patterns

**Bottom Navigation (Primary):**
- Icons: Home, Search, Add (FAB overlay), Notifications, Profile
- Selected icon highlighted, label visible
- Taps change main content area
- FAB always visible for primary action (contextual)

**Sidebar (Secondary):**
- Accessible via swipe from right or menu icon in header
- Contains: Projects, Calendar, Team, Settings
- Closes on item selection or tap outside
- Swipe left to dismiss

**Top App Bar:**
- Left: Back button (if hierarchical) or menu (hamburger)
- Center: Screen title
- Right: Actions (search, more options)
- Elevation shadow
- Changes color on scroll (optional)

**Navigation Patterns:**
- **Stack**: For hierarchical screens (login → onboarding → home)
- **Tab**: For peer screens (dashboard sections)
- **Modal**: For transient tasks (create item, settings)
- **Drawer**: For secondary navigation (sidebar on mobile)

### 8. Redirects & Empty States

**Authentication Redirects:**
- Not authenticated → /auth/login (store intended route)
- Authenticated accessing auth pages → redirect to /
- Email not verified → show verification prompt with resend option

**Authorization:**
- Insufficient permissions → show error message, suggest contact admin
- Hidden UI elements for lack of permission

**Empty States:**
- Illustrated + clear call-to-action
- Primary button for obvious next step
- Secondary button for alternative/action

**Loading States:**
- Skeleton loaders for content
- Spinner for full-page loads
- Button loading states
- Optimistic UI where appropriate

### 9. Cross-Platform Consistency

**Web:**
- Browser back/forward supported
- URL updates reflect state
- Keyboard shortcuts (Cmd/Ctrl + modifiers)
- Right-click context menus
- Drag and drop with mouse

**Mobile Web/Native App:**
- Touch gestures (swipe, pinch)
- Hardware back button (Android)
- Status bar integration
- Safe area considerations
- Native share sheet

**Desktop App (Electron/Tauri):**
- Menu bar (File, Edit, View, etc.)
- System tray icon
- Window controls (minimize, maximize, close)
- Keyboard shortcuts (platform-specific)
- File system access (save/export)

### 10. Implementation Notes

**Routing Library:**
- React Router v6 (for web)
- Native stack/tab navigators (for React Native if applicable)
- Code splitting with lazy<Suspense> for route components

**State Synchronization:**
- URL state ↔ Application state (via useSearchParams or similar)
- History API for programmatic navigation
- Block navigation when form dirty (prompt to save)

**Accessibility:**
- Manage focus on navigation changes
- Announce route changes to screen readers (aria-live)
- Skip links for keyboard users
- Ensure dropdowns/menus are keyboard accessible

**Performance:**
- Prefetch data for anticipated routes
- Cancel stale requests on navigation
- Implement route-based code splitting
- Use transition hooks for loading states

**Testing:**
- Unit tests for route matching and guards
- Integration tests for navigation flows
- End-to-end tests for critical paths
- Manual testing for edge cases (back button, refresh)

## Specific User Flows

### 1. Onboarding Flow
```
Landing Page → Sign Up → Email Verification → Welcome Survey → 
Template Selection → Workspace Creation → Tutorial/Tooltip Tour → Dashboard
```

### 2. Create Project Flow
```
Dashboard → [New Project] Modal → 
[Name] [Description] [Template] → [Create] → 
Project Overview (Board View) → [Add First Task]
```

### 3. Create Task Flow
**From Board:**
```
Board View → [+ Add Task] in column → 
Inline editor: [Title] [Enter] → 
Task card appears → [Click to open detail] → 
[Add description] [Set assignee] [Set due date] [Save]
```

**From Global Add:**
```
Anywhere → [FAB +] → 
[Title] [Project: ▼] [Assignee: ▼] [Due: 📅] → 
[Create] → Task added to project backlog
```

### 4. Edit Task Flow
```
Task Card → [Click title or open icon] → 
Task Detail Sidebar → 
[Edit description] [Change assignee] [Update dates] → 
[Save] button or auto-save on blur
```

### 5. Comment on Task Flow
```
Task Detail → Comments section → 
[Add a comment...] textarea → 
[Type message] [Attach file] [@mention] → 
[Post] (Ctrl+Enter or button) → 
Comment appears with animation
```

### 6. Navigate to Specific Task
**From Notification:**
```
Notification bell → [Notification: "Sarah mentioned you in task X"] → 
Click → 
Navigates to project → 
Opens task sidebar → 
Scrolls to comment if applicable
```

**From Search:**
```
Search bar → Type "homepage" → 
Press Enter → 
Search results page → 
Click task "Design homepage" → 
Opens task sidebar in project context
```

### 7. Switch Project Context
```
Sidebar → [Project list] → 
Click different project → 
URL updates to /projects/:newId → 
Project header updates → 
Main view shows last used tab for that project
```

### 8. Access Settings
```
Sidebar → [Settings] (gear icon) → 
Settings overview page → 
Click "Members" tab → 
Members management view → 
[Invite Member] → 
Enter email, select role → 
[Send Invite]
```

### 9. Logout Flow
```
User avatar (header) → 
Click → 
Dropdown menu → 
[Logout] → 
Clear session → 
Redirect to landing page
```

### 10. Error Recovery
**404 Page:**
```
[Illustration: Lost robot] 
"Page not found" 
"The page you're looking for doesn't exist"
[Back to Home] [Go to Dashboard]
```

**Network Error:**
```
Banner at top: 
"You're offline" 
[Retry] [Dismiss] 
OR 
Modal for critical actions: 
"Save failed" 
[Try Again] [Cancel]
```

**Form Validation Error:**
```
Inline red text under field
Red border on input
Focus on first invalid field
Submit button disabled
```

---
*Navigation flows should be tested with real users to validate intuitiveness and efficiency. Analytics should track drop-off points in critical flows.*