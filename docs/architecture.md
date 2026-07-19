# System Architecture
## Stokku v2.0 — Technical Architecture Specification

**Version:** 2.0.0-draft  
**Status:** Engineering Review  
**Classification:** Internal — Engineering Team  
**Date:** July 2026

---

## 1. Architectural Overview

### 1.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Web App    │  │  Mobile PWA │  │  3rd Party  │  │  Webhooks   │        │
│  │  (Next.js)  │  │  (SW + WS)  │  │  Integrations│  │  Consumers  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE NETWORK                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     CLOUDFLARE WORKERS (API)                        │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │    │
│  │  │  REST v1    │ │  GraphQL    │ │  Webhooks   │ │  Auth       │  │    │
│  │  │  (Hono)     │ │  (Yoga)     │ │  Dispatcher │ │  (Better)   │  │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │              MIDDLEWARE CHAIN                                │  │    │
│  │  │  Rate Limit → Auth → Org Context → Validation → Logging     │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   CLOUDFLARE PAGES (WEB)                            │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │    │
│  │  │  RSC App    │ │  Static     │ │  Edge       │ │  Preview    │  │    │
│  │  │  (Next.js)  │ │  Assets     │ │  Functions  │ │  Deployments│  │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  NEON POSTGRESQL│  │  UPSTASH REDIS  │  │  CLOUDFLARE R2  │              │
│  │  (Primary DB)   │  │  (Cache/Sessions│  │  (Object Storage)            │
│  │  - Multi-tenant │  │   Rate Limits)  │  │  - Images       │              │
│  │  - RLS          │  │  - Pub/Sub      │  │  - Exports      │              │
│  │  - Branching    │  │  - Sessions     │  │  - Backups      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  SENTRY     │  │  CLOUDFLARE │  │  PINO/LOKI  │  │  HEALTH     │        │
│  │  (Errors,   │  │  ANALYTICS  │  │  (Structured│  │  CHECKS     │        │
│  │   Perf,     │  │  (Workers,  │  │   Logs)     │  │  /ready     │        │
│  │   Replay)   │  │   Pages)    │  │             │  │  /health    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

| Principle | Application |
|-----------|-------------|
| **Edge-first** | Compute at Cloudflare Edge (Workers/Pages) — sub-50ms latency globally |
| **Serverless by default** | No servers to manage; auto-scale to zero; pay-per-request |
| **Type-safe end-to-end** | Drizzle ORM → OpenAPI → TypeScript types → Zod validation → React Hook Form |
| **Multi-tenant from day one** | `org_id` on every table; RLS enforced at database level |
| **Immutable audit trail** | Append-only `audit_log` table with hash chaining |
| **Optimistic UI + Real-time** | TanStack Query mutations + Supabase Realtime / Ably WebSockets |
| **Observability built-in** | Structured logs, distributed traces, metrics from day one |
| **Security by default** | CSP, rate limiting, RBAC, encrypted secrets, dependency scanning |

---

## 2. Component Architecture

### 2.1 Monorepo Structure (Turborepo)

```
stokku/
├── apps/
│   ├── web/                    # Next.js 15 (App Router, RSC)
│   │   ├── src/
│   │   │   ├── app/            # Routes (RSC + Client Components)
│   │   │   ├── components/     # Feature components
│   │   │   ├── lib/            # Client utilities
│   │   │   └── hooks/          # React hooks
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # Hono on Cloudflare Workers
│       ├── src/
│       │   ├── routes/         # REST endpoints (feature-based)
│       │   ├── graphql/        # GraphQL Yoga schema/resolvers
│       │   ├── middleware/     # Auth, rate limit, validation, logging
│       │   ├── services/       # Business logic (DI container)
│       │   ├── db/             # Drizzle client, migrations, seeds
│       │   └── utils/          # Helpers
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   ├── ui/                     # Design System (React + Tailwind)
│   │   ├── src/
│   │   │   ├── primitives/     # Button, Input, Dialog, etc.
│   │   │   ├── patterns/       # DataTable, FormLayout, Wizard
│   │   │   ├── charts/         # Recharts wrappers
│   │   │   ├── tokens/         # Design tokens (CSS vars)
│   │   │   └── utils/          # cn(), tv(), etc.
│   │   ├── .storybook/
│   │   └── package.json
│   │
│   ├── shared/                 # Shared utilities (both apps)
│   │   ├── src/
│   │   │   ├── constants/      # App-wide constants
│   │   │   ├── errors/         # Error classes, codes
│   │   │   ├── validation/     # Zod schemas (shared)
│   │   │   ├── date/           # date-fns wrappers
│   │   │   └── crypto/         # Hash, encrypt utilities
│   │   └── package.json
│   │
│   ├── types/                  # Generated + manual types
│   │   ├── src/
│   │   │   ├── api/            # OpenAPI generated types
│   │   │   ├── database/       # Drizzle inferred types
│   │   │   ├── graphql/        # GraphQL codegen types
│   │   │   └── domain/         # Domain models
│   │   └── package.json
│   │
│   ├── config/                 # Shared configuration
│   │   ├── eslint/
│   │   ├── prettier/
│   │   ├── tailwind/
│   │   ├── typescript/
│   │   └── package.json
│   │
│   └── database/               # Database package (internal)
│       ├── src/
│       │   ├── schema/         # Drizzle schema definitions
│       │   ├── migrations/     # Generated migrations
│       │   ├── seeds/          # Seed scripts
│       │   └── rls/            # RLS policies
│       └── package.json
│
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── api/                    # OpenAPI specs (generated)
│   ├── architecture/
│   └── ...
│
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   └── dependabot.yml
│
├── docker/
│   ├── docker-compose.yml      # Local dev stack
│   └── Dockerfile.*
│
├── scripts/                    # Build, deploy, migration scripts
│
├── turbo.json                  # Turborepo config
├── package.json                # Root workspace
├── pnpm-workspace.yaml
└── README.md
```

### 2.2 API Layer (apps/api)

```
src/
├── index.ts                    # Hono app factory
├── middleware/
│   ├── auth.ts                 # Better Auth session validation
│   ├── org-context.ts          # Extract org_id, enforce membership
│   ├── rate-limit.ts           # Upstash sliding window
│   ├── validation.ts           # Zod request validation
│   ├── logging.ts              # Pino structured logging
│   ├── cors.ts                 # Configured CORS
│   └── error-handler.ts        # RFC 9457 problem details
├── routes/
│   ├── v1/
│   │   ├── auth/               # POST /login, /register, /refresh, /logout
│   │   ├── orgs/               # GET/PATCH /me, /:id/members, /:id/settings
│   │   ├── warehouses/         # CRUD + hierarchy
│   │   ├── categories/         # CRUD + tree
│   │   ├── products/           # CRUD, variants, images, search
│   │   ├── stock/              # Levels, movements, adjustments, transfers
│   │   ├── suppliers/          # CRUD, catalog, scorecards
│   │   ├── purchase-orders/    # CRUD, receive, approve, email
│   │   ├── sales-orders/       # CRUD, allocate, pick, pack, ship
│   │   ├── customers/          # CRUD, price lists
│   │   ├── reports/            # Generate, schedule, export
│   │   ├── notifications/      # Preferences, history, push tokens
│   │   ├── webhooks/           # Register, test, delivery logs
│   │   ├── api-keys/           # CRUD, rotate, scopes
│   │   └── audit/              # Query audit log
│   └── health.ts               # GET /health, /ready
├── graphql/
│   ├── schema.ts               # TypeDefs (modular per feature)
│   ├── resolvers/              # Resolvers with DataLoader
│   ├── context.ts              # Auth, org, loaders
│   └── subscriptions.ts        # WebSocket subscriptions
├── services/                   # Business logic (injected)
│   ├── inventory.service.ts
│   ├── procurement.service.ts
│   ├── sales.service.ts
│   ├── valuation.service.ts
│   └── notification.service.ts
├── db/
│   ├── client.ts               # Drizzle + Neon serverless
│   ├── schema/                 # Tables, indexes, relations
│   ├── rls/                    # RLS policies (SQL)
│   ├── migrations/             # Drizzle Kit output
│   └── seeds/                  # Deterministic seeds
└── utils/
    ├── crypto.ts               # Hash, encrypt, sign
    ├── email.ts                # Resend templates
    ├── pdf.ts                  # PDF generation (PDFKit)
    └── export.ts               # CSV/Excel streaming
```

### 2.3 Web Layer (apps/web)

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, register, reset, verify
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (dashboard)/            # Authenticated routes
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── dashboard/          # Overview widgets
│   │   ├── products/           # List, detail, create, edit
│   │   ├── stock/              # Adjustments, transfers, counts
│   │   ├── procurement/        # Suppliers, POs, receive
│   │   ├── sales/              # Customers, SOs, fulfill
│   │   ├── reports/            # Dashboard, builder, schedules
│   │   ├── settings/           # Org, warehouses, users, integrations
│   │   └── audit/              # Audit log viewer
│   ├── api/                    # Next.js Route Handlers (edge)
│   │   ├── auth/               # Better Auth callbacks
│   │   ├── webhooks/           # Stripe, inbound webhooks
│   │   └── upload/             # Presigned R2 URLs
│   ├── globals.css             # Tailwind + CSS variables
│   └── layout.tsx              # Root layout, providers
├── components/
│   ├── features/               # Feature-specific components
│   │   ├── products/
│   │   ├── stock/
│   │   ├── procurement/
│   │   ├── sales/
│   │   ├── reports/
│   │   └── settings/
│   ├── layout/                 # Sidebar, Header, Breadcrumbs
│   ├── providers/              # Query, Theme, Auth, WebSocket
│   └── ui/                     # Re-exports from @stokku/ui
├── hooks/                      # Custom React hooks
├── lib/
│   ├── api.ts                  # TanStack Query + Axios client
│   ├── auth.ts                 # Better Auth client
│   ├── websocket.ts            # Realtime client
│   └── utils.ts
└── styles/
```

### 2.4 Design System (packages/ui)

```
src/
├── primitives/                 # Atomic components (Radix + Tailwind)
│   ├── button/
│   ├── input/
│   ├── select/
│   ├── dialog/
│   ├── dropdown-menu/
│   ├── table/
│   ├── tabs/
│   ├── toast/
│   ├── tooltip/
│   ├── avatar/
│   ├── badge/
│   ├── checkbox/
│   ├── radio-group/
│   ├── switch/
│   ├── slider/
│   ├── progress/
│   ├── skeleton/
│   ├── separator/
│   ├── scroll-area/
│   ├── popover/
│   ├── hover-card/
│   ├── navigation-menu/
│   ├── sidebar/
│   ├── sheet/
│   ├── drawer/
│   ├── accordion/
│   ├── collapsible/
│   ├── context-menu/
│   ├── menubar/
│   ├── pagination/
│   ├── breadcrumb/
│   ├── label/
│   ├── textarea/
│   ├── checkbox/
│   ├── input-otp/
│   ├── toggle/
│   ├── toggle-group/
│   ├── aspect-ratio/
│   ├── carousel/
│   ├── chart/
│   ├── calendar/
│   ├── date-picker/
│   ├── file-upload/
│   ├── barcode-scanner/
│   └── data-grid/              # Virtualized (TanStack Virtual)
├── patterns/                   # Composed patterns
│   ├── form-layout/
│   ├── wizard/
│   ├── empty-state/
│   ├── loading-state/
│   ├── error-state/
│   ├── confirm-dialog/
│   ├── command-palette/
│   └── data-table/
├── charts/                     # Recharts wrappers
│   ├── area-chart/
│   ├── bar-chart/
│   ├── line-chart/
│   ├── pie-chart/
│   ├── radar-chart/
│   └── sparkline/
├── tokens/
│   ├── colors.css              # CSS variables (light/dark)
│   ├── spacing.css
│   ├── typography.css
│   ├── shadows.css
│   ├── radii.css
│   ├── transitions.css
│   └── z-index.css
├── utils/
│   ├── cn.ts                   # clsx + tailwind-merge
│   ├── tv.ts                   # tailwind-variants
│   └── focus-ring.ts
└── index.ts                    # Public exports
```

---

## 3. Data Flow Patterns

### 3.1 Read Path (Dashboard Load)

```
1. Browser → Cloudflare Pages (Next.js RSC)
2. RSC fetches via TanStack Query (server-side)
   → API (Cloudflare Workers) → Drizzle → Neon PostgreSQL
3. RSC renders initial HTML (streaming)
4. Client hydrates → TanStack Query hydrates cache
5. WebSocket connects (Supabase Realtime / Ably)
6. Real-time updates → Query cache invalidation → Re-render
```

### 3.2 Write Path (Stock Adjustment)

```
1. User clicks "Adjust Stock" → Dialog opens (optimistic UI)
2. User enters qty, reason → Submit
3. TanStack Query mutation:
   a. Optimistic update: cache.setQueryData(['stock', variantId], newQty)
   b. POST /api/v1/stock/adjustments → Cloudflare Workers
4. Workers middleware:
   a. Rate limit check (Upstash)
   b. Auth validation (Better Auth)
   c. Org context extraction + membership check
   d. Zod validation
5. InventoryService.adjustStock():
   a. Begin transaction
   b. Insert stock_movement (immutable)
   c. Update stock_levels (on-hand, available)
   d. Check reorder point → emit low_stock event
   e. Insert audit_log entry (hash chained)
   f. Commit
6. Event published to Redis Pub/Sub → WebSocket broadcast
7. API returns 201 with movement object
8. TanStack Query: onSuccess → invalidateQueries(['stock', 'reports'])
9. Toast: "Stock adjusted successfully"
```

### 3.3 Real-time Synchronization

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Worker A   │     │  Redis      │     │  Worker B   │
│  (Write)    │────▶│  Pub/Sub    │────▶│  (WebSocket)│
└─────────────┘     │  Channel:   │     └──────┬──────┘
                    │  org:{id}   │            │
                    └─────────────┘            ▼
                                           ┌─────────────┐
                                           │  Browser    │
                                           │  (Client)   │
                                           └─────────────┘
```

- Channel per organization: `org:{orgId}`
- Events: `stock.updated`, `po.status_changed`, `so.status_changed`, `notification.created`
- Client subscribes via WebSocket (Supabase Realtime or Ably)
- TanStack Query listens → `queryClient.invalidateQueries()` or `setQueryData()`

---

## 4. Security Architecture

### 4.1 Defense in Depth

| Layer | Controls |
|-------|----------|
| **Network** | Cloudflare WAF, DDoS protection, Bot management |
| **Edge** | CSP, HSTS, Rate limiting (per IP + per user), Bot challenge |
| **Application** | Better Auth (secure sessions), RBAC middleware, Zod validation |
| **Database** | RLS policies (org_id), parameterized queries (Drizzle), least privilege roles |
| **Data** | AES-256 at rest (Neon), TLS 1.3 in transit, PII encryption at app layer |
| **Supply Chain** | npm audit, CodeQL, Dependabot, signed commits, SBOM generation |

### 4.2 Authentication Flow

```
1. User submits credentials → POST /api/v1/auth/login
2. Better Auth verifies → Creates session (DB) + JWT access (15m) + refresh (30d)
3. Response: Set-Cookie (HttpOnly, Secure, SameSite=Lax) + JSON { user, org }
4. Subsequent requests: Cookie auto-sent → Middleware validates JWT
5. Refresh: POST /api/v1/auth/refresh → Rotate refresh token, issue new access
6. Logout: POST /api/v1/auth/logout → Revoke session, clear cookies
```

### 4.3 Authorization Model

```
Organization (tenant)
  └── Members (user + role)
        └── Permissions (role-based)
              └── Resources (scoped to org_id)
```

- Every API request: `org_id` extracted from session → validated against membership
- Database RLS: `CREATE POLICY ... USING (org_id = current_setting('app.org_id')::uuid)`
- API keys: Scoped to org + permissions (read:products, write:stock, etc.)

---

## 5. Infrastructure as Code

### 5.1 Cloudflare Resources (Terraform / Wrangler)

| Resource | Configuration |
|----------|---------------|
| **Workers** | `wrangler.toml` per environment (dev/staging/prod) |
| **Pages** | Connected to GitHub repo; preview on PR, prod on main |
| **D1** | Not used (Neon preferred for PostgreSQL) |
| **R2** | Buckets: `images`, `exports`, `backups`; CORS configured |
| **KV** | Feature flags, rate limit configs (optional) |
| **Queues** | Webhook delivery, report generation (P1) |
| **Workers AI** | Embeddings for semantic search (P2) |

### 5.2 Neon PostgreSQL

- **Branching**: `main` → `preview/{pr-number}` for each PR
- **Autoscaling**: 0-100 CU; storage auto-grow
- **PITR**: 7-day retention
- **Roles**: `stokku_app` (RLS), `stokku_migrate` (DDL), `stokku_readonly` (reports)

### 5.3 Upstash Redis

- **Database**: Primary (cache, sessions, rate limits)
- **Pub/Sub**: Real-time events
- **Region**: Global (auto-replicate)

---

## 6. Deployment Pipeline

### 6.1 CI (GitHub Actions) — Every Push

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup-pnpm, turbo run lint]
  
  typecheck:
    runs-on: ubuntu-latest
    steps: [checkout, setup-pnpm, turbo run typecheck]
  
  test-unit:
    runs-on: ubuntu-latest
    services: [postgres, redis]
    steps: [checkout, setup-pnpm, turbo run test:unit]
  
  test-integration:
    runs-on: ubuntu-latest
    services: [postgres, redis]
    steps: [checkout, setup-pnpm, turbo run test:integration]
  
  build:
    needs: [lint, typecheck, test-unit, test-integration]
    runs-on: ubuntu-latest
    steps: [checkout, setup-pnpm, turbo run build]
  
  docker:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps: [build & push multi-arch images to GHCR]
```

### 6.2 CD — Preview & Production

| Trigger | Action |
|---------|--------|
| PR opened/updated | Cloudflare Pages preview deployment (unique URL) |
| PR merged to main | Cloudflare Pages production deploy + Workers deploy |
| Tag `v*` pushed | GitHub Release + Docker images tagged + migration run |

### 6.3 Database Migrations

```yaml
# GitHub Action: migrate
- Uses Neon branching: create `migrate-{sha}` branch from `main`
- Run `drizzle-kit migrate` on branch
- Run integration tests against branch
- On success: promote branch to `main` (Neon branch promotion)
- On failure: alert, keep branch for debugging
```

### 6.4 Rollback Strategy

| Scenario | Action | RTO |
|----------|--------|-----|
| Bad deploy (Workers) | `wrangler rollback` (instant) | < 30s |
| Bad deploy (Pages) | Revert to previous Pages deployment | < 60s |
| Bad migration | Neon branch point-in-time restore | < 5min |
| Data corruption | PITR to last clean state | < 15min |

---

## 7. Observability Stack

### 7.1 Logging (Pino → Cloudflare Logs / Loki)

```json
{
  "timestamp": "2026-07-19T10:30:00.123Z",
  "level": 30,
  "trace_id": "a1b2c3d4e5f6",
  "span_id": "f6e5d4c3b2a1",
  "user_id": "usr_abc123",
  "org_id": "org_xyz789",
  "action": "stock.adjust",
  "resource": "variant:vnt_123",
  "duration_ms": 45,
  "status": "success",
  "message": "Stock adjusted: +10 units"
}
```

### 7.2 Tracing (W3C TraceContext)

- Workers: `trace-id`, `parent-id` headers propagated
- Database: `pg_trace` extension for SQL spans
- Frontend: `@sentry/browser` + `sentry-trace` header

### 7.3 Metrics (Prometheus format → Cloudflare Analytics)

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | method, path, status, org_id |
| `http_request_duration_ms` | Histogram | method, path, org_id |
| `db_query_duration_ms` | Histogram | table, operation |
| `stock_adjustments_total` | Counter | type, org_id |
| `webhook_deliveries_total` | Counter | event, status |
| `active_organizations` | Gauge | tier |

### 7.4 Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| HighErrorRate | `rate(http_requests_total{status=~"5.."}[5m]) > 0.01` | Critical | PagerDuty |
| HighLatency | `histogram_quantile(0.95, http_request_duration_ms) > 500` | Warning | Slack |
| DBConnectionsHigh | `pg_stat_activity_count > 80` | Warning | Slack |
| QueueBacklog | `webhook_queue_depth > 1000` | Warning | Slack |
| CertExpiring | `ssl_cert_expiry_days < 30` | Info | Email |

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

| Data | Frequency | Retention | Verification |
|------|-----------|-----------|--------------|
| Neon (PITR) | Continuous | 7 days | Automated restore test weekly |
| Neon (Logical) | Daily 02:00 UTC | 30 days | `pg_dump` → R2, checksum verified |
| Redis | Not backed up (ephemeral) | N/A | N/A |
| R2 (images/exports) | Versioned | 90 days | Lifecycle policy |
| Secrets | GitHub Environments + 1Password | N/A | Rotation policy |

### 8.2 Recovery Procedures

| Scenario | RPO | RTO | Procedure |
|----------|-----|-----|-----------|
| Region outage (Primary) | < 1hr | < 4hr | Failover to Neon EU + Cloudflare global |
| Accidental `DROP TABLE` | < 1hr | < 30min | Neon PITR to before drop |
| Ransomware | < 24hr | < 4hr | Restore from verified R2 backups |
| Credential leak | Immediate | < 15min | Rotate all secrets, revoke sessions |

---

## 9. Cost Model (Estimated Monthly at Scale)

| Service | Free Tier | 1,000 Orgs | 10,000 Orgs |
|---------|-----------|------------|-------------|
| Cloudflare Workers | 100k req/day | $5 (paid plan) | $25 |
| Cloudflare Pages | Unlimited | Included | Included |
| Neon PostgreSQL | 0.5 GB, 190 CU-hrs | $19 (Scale plan) | $100+ |
| Upstash Redis | 10k req/day, 256MB | $25 | $100 |
| Cloudflare R2 | 10 GB/mo | $5 | $50 |
| Sentry | 5k errors/mo | $26 (Team) | $80 |
| Resend | 3k emails/mo | $20 | $100 |
| Stripe | 2.9% + 30¢ | Variable | Variable |
| **Total (excl. Stripe)** | **$0** | **~$120/mo** | **~$455/mo** |

*Cost scales sub-linearly; generous free tiers cover alpha/beta*

---

## 10. ADR Index (Planned)

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Use Cloudflare Workers + Pages for compute | Proposed |
| 002 | Neon PostgreSQL for primary database | Proposed |
| 003 | Better Auth for authentication | Proposed |
| 004 | Drizzle ORM for database access | Proposed |
| 005 | TanStack Query for server state | Proposed |
| 006 | Hono for API framework | Proposed |
| 007 | Tailwind CSS v4 + CSS Variables for styling | Proposed |
| 008 | Turborepo for monorepo management | Proposed |
| 009 | Supabase Realtime / Ably for WebSockets | Proposed |
| 010 | Immutable audit log with hash chaining | Proposed |

---

*End of System Architecture*