# API Design

## Overview
RESTful API with JSON:API specification for consistency and extensibility.
Versioned via URL path: `/api/v1/`.

## Authentication
- JWT access tokens (short-lived, 15min)
- Refresh tokens (HTTP-only, secure cookies, 7-day refresh)
- OAuth 2.0 for Google OAuth
- API keys for service-to-service (future)

## Base URL
```
https://api.stokku.com/api/v1
```

## Core Resources

### Auth
- POST `/auth/register` - User registration
- POST `/auth/login` - Email/password login
- POST `/auth/google` - Google OAuth callback
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - Invalidate refresh token
- POST `/auth/forgot-password` - Initiate password reset
- POST `/auth/reset-password` - Complete password reset
- POST `/auth/verify-email` - Verify email token
- POST `/auth/resend-verification` - Resend verification email

### Users
- GET `/users/me` - Current user profile
- PATCH `/users/me` - Update profile
- GET `/users/:id` - Public profile (limited fields)
- GET `/users` - List users (admin/paginated)

### Workspaces
- GET `/workspaces` - List user's workspaces (with pagination, filters)
- POST `/workspaces` - Create workspace
- GET `/workspaces/:id` - Get workspace details
- PATCH `/workspaces/:id` - Update workspace
- DELETE `/workspaces/:id` - Delete workspace (soft delete)
- GET `/workspaces/:id/members` - List members
- POST `/workspaces/:id/members` - Invite member
- PATCH `/workspaces/:id/members/:userId` - Update member role
- DELETE `/workspaces/:id/members/:userId` - Remove member

### Projects
- GET `/projects` - List projects (filtered by workspace)
- POST `/projects` - Create project
- GET `/projects/:id` - Get project details
- PATCH `/projects/:id` - Update project
- DELETE `/projects/:id` - Delete project (soft delete)
- GET `/projects/:id/tasks` - List tasks for project

### Tasks
- GET `/tasks` - List tasks (with filtering, sorting, pagination)
- POST `/tasks` - Create task
- GET `/tasks/:id` - Get task details
- PATCH `/tasks/:id` - Update task
- DELETE `/tasks/:id` - Delete task (soft delete)
- POST `/tasks/:id/assignee` - Assign/unassign user
- POST `/tasks/:id/comments` - Add comment
- GET `/tasks/:id/comments` - List comments
- POST `/tasks/:id/attachments` - Upload attachment
- GET `/tasks/:id/attachments` - List attachments

### Comments
- GET `/comments/:id` - Get comment
- PATCH `/comments/:id` - Update comment
- DELETE `/comments/:id` - Delete comment
- POST `/comments/:id/replies` - Reply to comment

### Notifications
- GET `/notifications` - List user's notifications
- PATCH `/notifications/:id/read` - Mark as read
- PATCH `/notifications/read-all` - Mark all as read
- DELETE `/notifications/:id` - Delete notification

### Attachments
- GET `/attachments/:id/download` - Download file
- DELETE `/attachments/:id` - Delete attachment

## Filtering, Sorting, Pagination
- Filter: `?status=in_progress&priority=high`
- Sort: `?sort=-created_at,title` (descending by created_at, then title asc)
- Pagination: `?page=2&limit=20` (returns `data`, `meta` with pagination info)

## Rate Limiting
- 100 requests per 15 minutes per IP for auth endpoints
- 1000 requests per 15 minutes per authenticated user for API
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Responses
```json
{
  "errors": [
    {
      "id": "unique-error-id",
      "status": "400",
      "code": "VALIDATION_ERROR",
      "title": "Validation Error",
      "detail": "Email is required",
      "source": { "pointer": "/data/attributes/email" }
    }
  ]
}
```

## Success Responses
```json
{
  "data": { /* resource object */ }
}

// For collections
{
  "data": [ /* array of resource objects */ ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## WebSocket Events (Real-time)
- Connection: `ws://api.stokku.com/v1/ws?token=<jwt>`
- Events:
  - `task:created`
  - `task:updated`
  - `task:deleted`
  - `comment:created`
  - `notification:created`
  - `presence:user-joined`
  - `presence:user-left`

## Health Check
- GET `/health` - Returns `{ status: "ok", timestamp, version }`
- GET `/health/detailed` - Includes DB, cache, external services status

## Versioning
- Backward compatible changes: minor version bump
- Breaking changes: new major version (v2)
- Deprecation notices in response headers: `Deprecation: true`, `Sunset: <date>`

## Security
- All endpoints require authentication except auth endpoints and public resources
- Input validation via schema (Zod/Joi)
- Output sanitization to prevent XSS
- SQL injection prevention via ORM/parameterized queries
- Rate limiting and brute-force protection
- CORS restricted to trusted domains
- Security headers: Helmet, CSP, HSTS

## Documentation
- OpenAPI 3.0 specification available at `/api/docs`
- Postman collection available
- SDKs: JavaScript/TypeScript, Python, Go