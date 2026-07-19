# Database Design

## Database Choice
**Selected:** PostgreSQL (managed via Neon.Tech free tier)
**Why:**
- Free tier sufficient for MVP
- Strong ACID compliance
- Excellent tooling and ecosystem
- Horizontal scaling via read replicas
- JSONB for flexible metadata
- Better than MongoDB Atlas (no vendor lock-in, better SQL support)
- Better than Firebase (more control, predictable pricing)
- Better than Supabase (more mature, better performance at scale)

## Core Entities

### User
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) (nullable for OAuth)
- google_id: VARCHAR(255) UNIQUE (nullable)
- name: VARCHAR(255) NOT NULL
- avatar_url: TEXT
- role: VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
- email_verified: BOOLEAN DEFAULT FALSE
- email_verification_token: VARCHAR(255)
- email_verification_expires: TIMESTAMP
- password_reset_token: VARCHAR(255)
- password_reset_expires: TIMESTAMP
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- last_login_at: TIMESTAMP WITH TIME ZONE

### Workspace
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- description: TEXT
- owner_id: UUID (FK -> User.id) NOT NULL
- visibility: VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team'))
- settings: JSONB DEFAULT '{}'
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### WorkspaceMember (Many-to-Many: User <-> Workspace)
- id: UUID (PK)
- user_id: UUID (FK -> User.id) NOT NULL
- workspace_id: UUID (FK -> Workspace.id) NOT NULL
- role: VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
- joined_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- UNIQUE(user_id, workspace_id)

### Project
- id: UUID (PK)
- workspace_id: UUID (FK -> Workspace.id) NOT NULL
- name: VARCHAR(255) NOT NULL
- description: TEXT
- status: VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed', 'on_hold'))
- start_date: DATE
- end_date: DATE
- settings: JSONB DEFAULT '{}'
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### Task
- id: UUID (PK)
- project_id: UUID (FK -> Project.id) NOT NULL
- assignee_id: UUID (FK -> User.id) (nullable)
- reporter_id: UUID (FK -> User.id) NOT NULL
- title: VARCHAR(255) NOT NULL
- description: TEXT
- status: VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'cancelled'))
- priority: VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
- due_date: TIMESTAMP WITH TIME ZONE
- estimated_hours: INTEGER
- actual_hours: INTEGER
- position: INTEGER (for ordering within columns)
- settings: JSONB DEFAULT '{}'
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### Comment
- id: UUID (PK)
- task_id: UUID (FK -> Task.id) NOT NULL
- author_id: UUID (FK -> User.id) NOT NULL
- content: TEXT NOT NULL
- parent_id: UUID (FK -> Comment.id) (nullable for threaded comments)
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### Attachment
- id: UUID (PK)
- task_id: UUID (FK -> Task.id) NOT NULL
- uploaded_by: UUID (FK -> User.id) NOT NULL
- filename: VARCHAR(255) NOT NULL
- file_url: TEXT NOT NULL
- file_size: INTEGER
- mime_type: VARCHAR(100)
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### Notification
- id: UUID (PK)
- user_id: UUID (FK -> User.id) NOT NULL
- type: VARCHAR(50) NOT NULL CHECK (type IN ('mention', 'assignment', 'comment', 'deadline', 'update'))
- entity_type: VARCHAR(50) NOT NULL CHECK (entity_type IN ('task', 'comment', 'project'))
- entity_id: UUID NOT NULL
- is_read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

## Relationships
- User 1:M Workspace (as owner)
- User M:M WorkspaceMember M:1 Workspace
- Workspace 1:M Project
- Project 1:M Task
- Task M:1 User (assignee)
- Task M:1 User (reporter)
- Task 1:M Comment
- Comment M:1 User (author)
- Comment M:M Comment (self-referential for replies)
- Task 1:M Attachment
- User 1:M Notification

## Indexes
- Users: email (unique), google_id (unique)
- WorkspaceMembers: user_id, workspace_id (unique composite)
- Projects: workspace_id
- Tasks: project_id, assignee_id, status, priority, due_date
- Comments: task_id, author_id, parent_id
- Attachments: task_id
- Notifications: user_id, is_read, created_at
- Composite indexes for common queries:
  - Tasks: (project_id, status, position)
  - Notifications: (user_id, is_read, created_at DESC)

## Migration Strategy
1. Use Prisma Migrate for version-controlled schema migrations
2. Seed data for initial workspace/templates
3. Backup strategy: Point-in-time recovery via Neon
4. Rollback: Prisma migrate reset + seed (dev), point-in-time restore (prod)

## Seed Data
- Default workspace template: "Getting Started"
- Sample project: "Website Redesign"
- Sample tasks with various statuses
- Demo user: demo@example.com (password: DemoPass123!)

## Scalability Considerations
- Read replicas for read-heavy operations (dashboard, listings)
- Connection pooling via PgBouncer
- Index optimization based on query patterns
- Archive old tasks/projects to cheaper storage
- CDN for static assets (attachments)
- Caching layer (Redis) for frequent queries
- Horizontal sharding by workspace_id for multi-tenant scale