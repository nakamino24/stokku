# Wireframes

## Overview
Low-fidelity wireframes representing core user flows and screen layouts.
Focus on layout, information hierarchy, and user flow - not visual design.

## 1. Authentication Flow

### 1.1 Landing Page
```
+----------------------------------------------------------+
| LOGO           Features   Pricing   About   Login/Signup |
+----------------------------------------------------------+
|                                                          |
|          [Product Name]                                  |
|          Simple project management for teams             |
|                                                          |
|   [Get Started - Free]    [Learn More]                   |
|                                                          |
|   [Screenshot of app interface]                          |
|                                                          |
|   Trusted by 10,000+ teams                               |
|                                                          |
+----------------------------------------------------------+
|           Features Grid                                  |
|  [Icon] Task Boards    [Icon] Real-time Chat    [Icon]   |
|                                                          |
+----------------------------------------------------------+
```

### 1.2 Sign Up / Login Modal
```
+-----------------------------+
| x                           |
|                             |
|     Welcome Back            |
|                             |
|   Email_____________________|
|   Password__________________|
|   [Forgot password?]        |
|                             |
|   [Sign In]                 |
|                             |
|   or continue with          |
|   [ Google   ]              |
|                             |
|   Don't have an account?    |
|   Sign up                   |
+-----------------------------+
```

### 1.3 Email Verification
```
+-----------------------------+
|                             |
|   Check your email          |
|                             |
|   We've sent a verification |
|   link to user@example.com  |
|                             |
|   [Resend email]            |
|                             |
+-----------------------------+
```

## 2. Workspace Dashboard (Home)

### 2.1 Desktop Layout
```
+------------------------------------------------------------------+
| LOGO  ▼ Workspace Name   Search...   [Bell]  [Avatar]  ▼        |
+------------------------------------------------------------------+
| + New Project   [Filter]   [Sort]   [View: Dashboard]            |
+------------------------------------------------------------------+
|                                                                  |
|  [Quick Stats]                                                   |
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐|
|  │ Projects    │ │ Tasks Due   │ │ Assigned to │ │ Completed   │|
|  │     5       │ │     3       │ │     7       │ │     12      │|
|  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘|
|                                                                  |
|  [New Project]                                                   |
|                                                                  |
|  Recent Activity                                                 |
|  ┌────────────────────────────────────────────────────────────┐|
|  │ • John created project "Website Redesign"                  │|
|  │ • Sarah assigned to task "Design homepage"                 │|
|  │ • Task "Review API docs" moved to Done                     │|
|  │ • Comment added: "Looks good!" on "Fix login bug"          │|
|  └────────────────────────────────────────────────────────────┘|
|                                                                  |
|  Pinned Projects                                                 |
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               |
|  │ Website     │ │ Mobile App  │ │ Internal    │               |
|  │ Redesign    │ │             │ │ Tools       │               |
|  └─────────────┘ └─────────────┘ └─────────────┘               |
|                                                                  |
+------------------------------------------------------------------+
```

### 2.2 Mobile Layout (Bottom Nav)
```
+------------------------------------------------------------------+
| LOGO  ▼ Workspace Name   Search...   [Bell]  [Avatar]  ▼        |
+------------------------------------------------------------------+
| + New Project   [Filter]   [Sort]   [View: Dashboard]            |
+------------------------------------------------------------------+
|                                                                  |
|  [Quick Stats - scrollable horizontally]                        |
|                                                                  |
|  Recent Activity                                                 |
|  ┌────────────────────────────────────────────────────────────┐|
|  │ • John created project "Website Redesign"                  │|
|  │ • ...                                                      │|
|  └────────────────────────────────────────────────────────────┘|
|                                                                  |
+------------------------------------------------------------------+
| [Home] [Search] [+] [Bell] [Profile]                            |
+------------------------------------------------------------------+
```

## 3. Project Views

### 3.1 Project Header (Common)
```
+------------------------------------------------------------------+
| [Arrow Left] Website Redesign                                    |
|                                                                  |
| [Description] Redesign company website with modern UI           |
|                                                                  |
| [Members: 3 avatars]   [Tags: web, ui]   [Due: Oct 15]          |
|                                                                  |
| [Export] [Duplicate] [Archive] [⋮]                               |
+------------------------------------------------------------------+
```

### 3.2 Board View (Kanban)
```
+------------------------------------------------------------------+
| Project Header (as above)                                        |
+------------------------------------------------------------------+
| [Filters] [Group by: Status]   [+ New Task]                      |
+------------------------------------------------------------------+
|                                                                  |
|  To Do (3)         In Progress (2)       Review (1)       Done (5)|
|  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐|
|  │ [ ] Design  │ │ [●] Code    │ │ [ ] Test    │ │ [✓] Launch  │|
|  │ homepage    │ │ frontend    │ │ backend API │ │             │|
|  │             │ │             │ │             │ │             │|
|  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘|
|  ┌─────────────┐                                               |
|  │ [ ] Setup   │                                               |
|  │ CI/CD       │                                               |
|  │             │                                               |
|  └─────────────┘                                               |
|                                                                  |
|  [Drag handle] visible on hover                                 |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.3 List View
```
+------------------------------------------------------------------+
| Project Header                                                   |
+------------------------------------------------------------------+
| [Filters] [Sort by: Due date]   [+ New Task]                     |
+------------------------------------------------------------------+
|                                                                  |
|  [ ] Task Title                    Assignee   Due      Status    |
|  ---------------------------------------------------------------|
|  [ ] Design homepage               John        Today  To Do      |
|  [●] Code frontend                 Sarah       Tomorrow In Prog  |
|  [ ] Write API docs                Alex        Fri      To Do    |
|  [ ] Review design                 Maria        Thu      To Do    |
|  [✓] Setup CI/CD                   Tom         Wed      Done     |
|                                                                  |
|  [Select all]   [Actions: ▼]                                    |
+------------------------------------------------------------------+
```

### 3.4 Calendar View
```
+------------------------------------------------------------------+
| Project Header                                                   |
+------------------------------------------------------------------+
| [Month: October 2023]  <   Today   >   [+ New Task]              |
+------------------------------------------------------------------+
|                                                                  |
|  Sun Mon Tue Wed Thu Fri Sat                                     |
|                                                                  |
|  1   2   3   4   5   [6]  7                                      |
|             ■■■                                                  |
|  8   9   10  11  12  13  14                                      |
|              ■                                                   |
|  15  16  17  18  19  20  21                                      |
|                   ■■■■■                                          |
|  22  23  24  25  26  27  28                                      |
|  ■■■■■■                                              ■           |
|  29  30  31                                              ■       |
|                                                                  |
|  [Legend] ■ = Task due today                                     |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.5 Timeline/Gantt View
```
+------------------------------------------------------------------+
| Project Header                                                   |
+------------------------------------------------------------------+
| [Zoom: ▼ Week]  [Dependencies]  [Critical Path]  [+ New Task]    |
+------------------------------------------------------------------+
|                                                                  |
|  Task Name                                                       |
|  ───────────────────────────────────────────────────────────────▶|
|  Design homepage      ██████████████████                         |
|  Code frontend                ████████████████████               |
|  Write API docs                     ██████████████               |
|  Review design                            ██████████             |
|  Setup CI/CD                                      ██████████     |
|  Launch                                                       ██ |
|                                                                  |
|  [Dependencies shown as arrows between bars]                     |
|                                                                  |
+------------------------------------------------------------------+
```

## 4. Task Detail View

### 4.1 Modal/Sidebar Layout
```
+------------------------------------------------------------------+
| [X]                                                              |
|                                                                  |
|  Design homepage                                                 |
|  ● In Progress    ▲ High     @John @Sarah                        |
|                                                                  |
|  ---------------------------------------------------------------|
|                                                                  |
|  Description                                                     |
|  Redesign the homepage with modern UI, improved navigation,      |
|  and mobile responsiveness. Include hero section, features,      |
|  testimonials, and call-to-action.                               |
|                                                                  |
|  ---------------------------------------------------------------|
|                                                                  |
|  Subtasks                                                        |
|  [ ] Wireframe mobile layout                                     |
|  [ ] Create high-fidelity mockups                                |
|  [ ] Implement responsive breakpoints                            |
|  [ ] User testing and feedback                                   |
|  [+ Add subtask]                                                 |
|                                                                  |
|  ---------------------------------------------------------------|
|                                                                  |
|  Due Date: Oct 10, 2023    [Calendar]                            |
|  Estimate: 8h                                                [⏰] |
|                                                                  |
|  Tags: [web] [ui] [redesign]                                     |
|  [+ Add tag]                                                     |
|                                                                  |
|  ---------------------------------------------------------------|
|                                                                  |
|  Attachments                                                     |
|  [📎] mockup-v1.png    [📎] brief.pdf    [+ Upload]               |
|                                                                  |
|  ---------------------------------------------------------------|
|                                                                  |
|  Comments                                                        |
|  ▼ Add a comment...                                              |
|                                                                  |
|  Sarah · 2h ago                                                  |
|  The mobile menu needs fixing. Can we make it a drawer?          |
|                                                                  |
|  John · 1h ago                                                   |
|  Agreed, I'll handle that in the responsive breakpoints task.    |
|   👍                                                             |
|                                                                  |
|  [File] [Emoji]                                                  |
|                                                                  |
+------------------------------------------------------------------+
```

### 4.2 Comment Thread
```
+------------------------------------------------------------------+
| Sarah · 2h ago                                                   |
| The mobile menu needs fixing. Can we make it a drawer?           |
|                                                                  |
|   [Reply]   [⋯]                                                  |
|                                                                  |
|   John · 1h ago                                                  |
|   Agreed, I'll handle that in the responsive breakpoints task.   |
|    👍                                                            |
|                                                                  |
|   [Reply]   [⋯]                                                  |
|                                                                  |
|   [Threaded replies indented with vertical line]                 |
|                                                                  |
|   ▼ Add a reply...                                               |
+------------------------------------------------------------------+
```

## 5. Team & Settings

### 5.1 Member Invitation Modal
```
+-----------------------------+
| x                           |
|                             |
|   Invite to Workspace       |
|                             |
|   Email_____________________|
|   Role ▼ [Member__________] |
|                             |
|   [Send Invitation]         |
|                             |
|   Role permissions:         |
|   • Member: View/edit own   |
|     tasks, comment          |
|   • Admin: Manage project,  |
|     members, settings       |
|   • Viewer: Read-only       |
|                             |
+-----------------------------+
```

### 5.2 Workspace Settings
```
+------------------------------------------------------------------+
| [Arrow Left] Workspace Settings                                  |
+------------------------------------------------------------------+
|                                                                  |
|  General                                                         |
|  Workspace name______________________                           |
|  Description________________________________________________     |
|                                                                  |
|  Members                                                         |
|  [Avatar] John Doe (Owner)   [Role: ▼]   [Remove]                |
|  [Avatar] Jane Smith         (Admin)  [Role: ▼]   [Remove]       |
|  [Invite Members]                                        [+]     |
|                                                                  |
|  Integrations                                                    |
|  [ ] Slack      [Connect]                                        |
|  [ ] Google Drive [Connect]                                      |
|  [ ] GitHub     [Connect]                                        |
|                                                                  |
|  Notifications                                                   |
|  [Email]   [In-app]   [Push]                                     |
|  • Task assigned to me                                           |
|  • Comment mentioned me                                          |
|  • Due date approaching                                          |
|                                                                  |
|  [Save Changes]                                                  |
+------------------------------------------------------------------+
```

## 6. Mobile Specific

### 6.1 Bottom Navigation
```
+------------------------------------------------------------------+
| [Home] [Search] [+] [Bell] [Profile]                            |
+------------------------------------------------------------------+
```

### 6.2 Quick Add Floating Action Button
```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                     [+] (FAB)                                    |
+------------------------------------------------------------------+
```

### 6.3 Sidebar (Collapsed/Expanded)
```
Collapsed:
+--+
|  |  [Icon: Home]   [Icon: Projects]   [Icon: Calendar]   [Icon: Team]
+--+

Expanded:
+--------------------------+
| LOGO                     |
| Dashboard                |
| Projects                 |
| Calendar                 |
| Team                     |
| Settings                 |
|                          |
| [Version 1.0.0]          |
+--------------------------+
```

## 7. Empty States

### 7.1 Empty Project
```
+-----------------------------+
|                             |
|     [Illustration:          |
|      empty desk]            |
|                             |
|   No projects yet           |
|                             |
|   Get started by creating   |
|   your first project        |
|                             |
|   [New Project]             |
|                             |
+-----------------------------+
```

### 7.2 Empty Task List
```
+-----------------------------+
|                             |
|     [Illustration:          |
|      clean checklist]       |
|                             |
|   No tasks here             |
|                             |
|   Add a task to get started |
|                             |
|   [+ New Task]              |
|                             |
+-----------------------------+
```

### 7.3 Empty Search
```
+-----------------------------+
|                             |
|     [Icon: Search]          |
|                             |
|   No results found          |
|                             |
|   Try different keywords    |
|                             |
|   or clear filters          |
|                             |
+-----------------------------+
```

## 8. Error States

### 8.1 404 Page
```
+-----------------------------+
|                             |
|     [Illustration:          |
|      lost robot]            |
|                             |
|   Page not found            |
|                             |
|   The page you're looking   |
|   for doesn't exist         |
|                             |
|   [Back to Home]            |
|                             |
+-----------------------------+
```

### 8.2 500 Error
```
+-----------------------------+
|                             |
|     [Icon: Warning]         |
|                             |
|   Something went wrong      |
|                             |
|   Our team has been notified|
|                             |
|   [Try Again]   [Report]    |
|                             |
+-----------------------------+
```

## 9. Onboarding Flow

### 9.1 Welcome Screen
```
+-----------------------------+
|                             |
|   Welcome to [Product]!     |
|                             |
|   Let's set up your workspace|
|                             |
|   [Get Started]             |
|                             |
+-----------------------------+
```

### 9.2 Team Size
```
+-----------------------------+
|                             |
|   How big is your team?     |
|                             |
|   [Just me]   [2-5]   [6-10]|
|   [10+]                                |
|                             |
|   [Next]                      |
|                             |
+-----------------------------+
```

### 9.3 Primary Use Case
```
+-----------------------------+
|                             |
|   What will you use it for? |
|                             |
|   [Product dev]   [Marketing]|
|   [Design]        [HR]       |
|   [Other ________]          |
|                             |
|   [Next]                    |
|                             |
+-----------------------------+
```

### 9.4 Template Selection
```
+-----------------------------+
|                             |
|   Choose a template         |
|                             |
|   [Blank]   [Product Launch]|
|   [Sprint]    [Event Plan]  |
|   [Content Cal] [OKR Track] |
|                             |
|   [Use Template]            |
|                             |
+-----------------------------+
```

## 10. Keyboard Shortcuts Modal
```
+-----------------------------+
| x                           |
|                             |
|   Keyboard Shortcuts        |
|                             |
|   Global                    |
|   ?     Show this help      |
|   /     Focus search        |
|   k     Quick add task      |
|   c     Add comment         |
|                                 |
|   Board                     |
|   Enter     Open task       |
|   Space     Assign to me    |
|   m     Assign member       |
|   d     Due date            |
|   l     Labels              |
|   x     Archive             |
|                                 |
|   [Close]                   |
+-----------------------------+
```

---
*Note: Wireframes are intentionally low-fidelity to focus on structure and flow. Visual design, typography, spacing, and branding will be defined in the Design System and applied in high-fidelity mockups.*