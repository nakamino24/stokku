# Technology Stack Evaluation
## Stokku v2.0 — Engineering Decision Records

**Version:** 2.0.0-draft  
**Status:** Engineering Review  
**Classification:** Internal — Engineering Team  
**Date:** July 2026

---

## 1. Evaluation Framework

### 1.1 Decision Criteria (Weighted)
| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Developer Experience** | 25% | Type safety, hot reload, debugging, documentation, community |
| **Production Readiness** | 20% | Reliability, observability, scaling, security defaults |
| **Cost Efficiency** | 20% | Free tier generosity, predictable scaling costs, no vendor lock-in |
| **Performance** | 15% | Latency, cold starts, bundle size, runtime efficiency |
| **Ecosystem & Integrations** | 10% | Libraries, tooling, hiring pool, third-party support |
| **Future Flexibility** | 10% | Portability, multi-cloud, escape hatches |

### 1.2 Scoring Methodology
- **5** = Exceptional (industry leader)
- **4** = Strong (above average)
- **3** = Adequate (meets requirements)
- **2** = Weak (significant gaps)
- **1** = Unsuitable (blocker)

---

## 2. Backend Platform Evaluation

### 2.1 Candidates Compared

| Platform | Type | DX (25%) | Prod Ready (20%) | Cost (20%) | Perf (15%) | Ecosystem (10%) | Flexibility (10%) | **Weighted Score** |
|----------|------|----------|------------------|------------|------------|-----------------|-------------------|-------------------|
| **Cloudflare Workers** | Edge Functions | 5 | 4 | 5 | 5 | 4 | 4 | **4.55** |
| **Hono + Cloudflare Workers** | Framework + Edge | 5 | 5 | 5 | 5 | 4 | 5 | **4.80** |
| **Vercel Edge Functions** | Edge Functions | 5 | 4 | 3 | 4 | 5 | 3 | **4.10** |
| **Railway** | Managed Node.js | 4 | 4 | 3 | 4 | 4 | 4 | **3.75** |
| **Render** | Managed Node.js | 4 | 4 | 3 | 4 | 4 | 4 | **3.75** |
| **Fly.io** | VMs (Firecracker) | 4 | 5 | 3 | 4 | 4 | 5 | **4.05** |
| **Appwrite** | BaaS (Self-hosted) | 3 | 3 | 4 | 3 | 3 | 3 | **3.15** |
| **PocketBase** | BaaS (Go, SQLite) | 4 | 3 | 5 | 4 | 2 | 3 | **3.55** |
| **Convex** | Reactive Backend | 4 | 3 | 2 | 4 | 3 | 2 | **3.15** |
| **Firebase** | BaaS (Google) | 4 | 4 | 3 | 4 | 5 | 1 | **3.55** |
| **Nhost** | Hasura + Auth + Storage | 3 | 3 | 3 | 3 | 3 | 3 | **3.00** |
| **Supabase** | PostgreSQL + Auth + Realtime | 4 | 4 | 2 | 4 | 5 | 2 | **3.50** |
| **Neon + Custom API** | Serverless PG + Workers | 4 | 5 | 4 | 5 | 4 | 5 | **4.35** |
| **Self-hosted PostgreSQL** | VM + K8s | 2 | 5 | 2 | 5 | 5 | 5 | **3.35** |

### 2.2 Detailed Analysis: Top Contenders

#### **Winner: Hono on Cloudflare Workers + Neon PostgreSQL**

**Why Hono + Cloudflare Workers:**
- **Zero cold starts** (V8 isolates, not Node.js processes)
- **Global by default** — 300+ locations, <50ms to 95% of users
- **Type-safe** — First-class TypeScript, Zod integration, OpenAPI generation
- **Standards-based** — Web Fetch API, WinterCG compliant, portable
- **Cost** — Free tier: 100k req/day; Paid: $5/mo + $0.50/million
- **Observability** — Built-in logs, metrics, traces; OpenTelemetry support
- **Durable Objects** — Stateful coordination for WebSockets, queues
- **Queues** — Reliable message delivery for webhooks, background jobs

**Why Neon PostgreSQL (not Supabase):**
| Factor | Neon | Supabase |
|--------|------|----------|
| **PostgreSQL Version** | 16 (latest) | 15 (lagging) |
| **Branching** | First-class, instant | Limited |
| **Autoscaling** | 0-100 CU, per-second | Fixed compute |
| **Pricing** | Pay-for-use, generous free | Per-project, expensive at scale |
| **Vendor Lock-in** | Standard PostgreSQL | Auth/Realtime/Storage tied |
| **PITR** | 7 days (free) | 7 days (Pro+) |
| **Extensions** | All PG extensions | Curated subset |
| **Connection Pooling** | PgBouncer built-in | PgBouncer built-in |

**Why NOT Supabase for backend:**
- We need **custom API layer** (Hono) for: RBAC, validation, rate limiting, audit logging, webhooks
- Supabase Edge Functions = Deno (different runtime, smaller ecosystem)
- PostgREST + RLS = great for simple CRUD, **insufficient for complex business logic** (PO workflow, stock movements, valuation)
- Lock-in: Auth, Realtime, Storage all proprietary
- **Neon gives us pure PostgreSQL** — we own the data layer completely

#### **Runner-up: Fly.io (if Workers prove limiting)**

- Full VMs (Docker), any language, any binary
- Global anycast, private networking, volumes
- More ops burden (no managed PG — need Neon anyway)
- Cost: ~$20/mo minimum for production

---

## 3. Database Evaluation

### 3.1 Primary Database: PostgreSQL (Non-Negotiable)

**Rationale:**
- ACID compliance for financial/inventory data
- Rich data types: JSONB, arrays, ranges, enums, UUID
- Mature ecosystem: tooling, extensions, hiring pool
- Extensions: `pg_trgm` (search), `btree_gin` (composite indexes), `pg_partman` (partitioning), `pg_cron` (jobs)
- **No vendor lock-in** — portable to any cloud

### 3.2 PostgreSQL Provider: Neon (Selected)

| Provider | Free Tier | Autoscaling | Branching | PITR | Extensions | Cost at Scale |
|----------|-----------|-------------|-----------|------|------------|---------------|
| **Neon** | 0.5 GB, 190 CU-hrs | ✅ 0-100 CU | ✅ Instant | 7 days | All | $$ |
| Supabase | 500 MB, shared CPU | ❌ Fixed | Limited | 7 days (Pro) | Curated | $$$ |
| RDS Aurora Serverless v2 | 1 month free | ✅ | ❌ | 35 days | Most | $$$ |
| Turso (libSQL) | 500 MB, 1B rows | ✅ | ✅ | ❌ | Limited | $ |
| Cloudflare D1 | 5 GB, 25B reads | ✅ | ❌ | ❌ | SQLite subset | $ |
| Railway | 1 GB, shared | ✅ | ❌ | ❌ | Most | $$ |
| Self-hosted (VM) | N/A | Manual | Manual | Manual | All | $ (ops cost) |

**Neon wins on:** Developer experience (branching for PR previews), true serverless PostgreSQL, cost efficiency, zero lock-in.

### 3.3 Cache: Upstash Redis

| Provider | Free Tier | Protocol | Global | Pricing | Why Upstash |
|----------|-----------|----------|--------|---------|-------------|
| **Upstash** | 10k req/day, 256 MB | HTTP/Redis | ✅ | Pay-per-request | Serverless, HTTP API works in Workers |
| Redis Cloud | 30 MB | Redis | ✅ | Fixed plans | — |
| Railway Redis | 100 MB | Redis | ❌ | Included | — |
| Self-hosted | N/A | Redis | Manual | VM cost | — |

**Upstash selected:** Native HTTP API (no TCP connections needed in Workers), global replication, generous free tier, per-request pricing.

### 3.4 Search: PostgreSQL Full-Text + pg_trgm (Phase 1)

- **Phase 1:** `tsvector` + GIN indexes + `pg_trgm` for fuzzy search — sufficient for 100k products
- **Phase 2:** Meilisearch on Fly.io/Railway if needed (typo tolerance, faceting, synonyms)
- **Not:** Elasticsearch (ops burden), Algolia (cost), Typesense (self-host complexity)

---

## 4. Frontend Stack Evaluation

### 4.1 Framework: Next.js 15 (App Router) — Selected

| Framework | RSC | DX | Performance | Ecosystem | Learning Curve | Verdict |
|-----------|-----|----|-------------|-----------|----------------|---------|
| **Next.js 15** | ✅ Native | 5 | 5 | 5 | 3 | **Selected** |
| Remix v2 | ✅ Native | 4 | 5 | 4 | 3 | Strong alt |
| Astro | ✅ Islands | 4 | 5 | 3 | 2 | Content-heavy |
| TanStack Start | ✅ Native | 3 | 5 | 2 | 4 | Early |
| Vite + React | ❌ | 5 | 4 | 5 | 2 | No RSC |

**Why Next.js 15:**
- **React Server Components** — Critical for SEO, initial load, data fetching at edge
- **App Router** — Nested layouts, streaming, parallel routes, intercepting routes
- **Turbopack** — Fast dev server, production builds
- **Vercel/Cloudflare Pages** — First-class deployment
- **Largest hiring pool**, best documentation, longest track record

### 4.2 Language: TypeScript (Strict Mode) — Non-Negotiable

- **Strict mode enabled** — Catch errors at compile time
- **Shared types** — `packages/types` generated from OpenAPI + Drizzle schema
- **No `any`** — ESLint `no-explicit-any: error`

### 4.3 Styling: Tailwind CSS v4 + CSS Variables — Selected

| Approach | DX | Performance | Theming | Bundle | Verdict |
|----------|----|-------------|---------|--------|---------|
| **Tailwind v4 + CSS Vars** | 5 | 5 (JIT) | 5 (native) | 4 | **Selected** |
| Tailwind v3 | 4 | 4 | 4 | 3 | Legacy |
| CSS Modules + Variables | 3 | 5 | 5 | 5 | Verbose |
| Styled Components | 2 | 2 | 4 | 2 | Runtime cost |
| Panda CSS | 4 | 5 | 5 | 4 | New, smaller ecosystem |

**Tailwind v4 advantages:** Native CSS variables, Lightning CSS (Rust), zero config, OKLCH colors, container queries.

### 4.4 UI Primitives: Radix UI + Custom Design System — Selected

| Library | Accessibility | Customization | Bundle | Maintenance | Verdict |
|---------|---------------|---------------|--------|-------------|---------|
| **Radix UI** | 5 (WAI-ARIA) | 5 (uncontrolled) | 4 | 5 | **Selected** |
| Headless UI | 5 | 4 | 4 | 4 | Tailwind-coupled |
| AriaKit | 5 | 5 | 3 | 3 | Smaller community |
| shadcn/ui | 5 | 5 | 4 | 4 | **Use as reference, not dependency** |
| Custom only | 5 | 5 | 5 | 1 | Too much work |

**Strategy:** Build `@stokku/ui` on Radix primitives. Copy shadcn patterns (cn, tv, component structure) but own the code. No shadcn dependency.

### 4.5 State Management

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Server State** | TanStack Query v5 | Caching, deduping, optimistic updates, mutations, prefetching |
| **Client State** | Zustand | Minimal, TypeScript-first, no providers, devtools |
| **Forms** | React Hook Form + Zod | Performance, validation, DX |
| **URL State** | Nuqs | Type-safe search params, SSR-compatible |

### 4.6 Real-time: Supabase Realtime (PostgreSQL Changes) — Selected

| Option | Protocol | Scaling | Cost | Integration | Verdict |
|--------|----------|---------|------|-------------|---------|
| **Supabase Realtime** | WebSocket | Managed | Included | Native PG changes | **Selected** |
| Ably | WebSocket | Managed | $$ | Any backend | Expensive |
| Pusher | WebSocket | Managed | $$ | Any backend | Expensive |
| Cloudflare Durable Objects | WebSocket | Self | Included | Workers native | Complex for PG changes |
| Custom (Socket.io) | WebSocket | Self | VM cost | Full control | High ops |

**Why Supabase Realtime:** Listens to PostgreSQL WAL → broadcasts changes. Zero code to sync stock movements, PO status, notifications. We already use Neon — Supabase Realtime can connect to any PostgreSQL (via `supabase/realtime` Elixir server self-hosted on Fly.io/Railway, or use their managed with external DB).

*Alternative:* **Ably** if Supabase Realtime proves unreliable with external DB. Budget: $65/mo for 1M messages.

---

## 5. Authentication: Better Auth — Selected

| Auth Solution | Type | Cost | Customization | MFA | Organizations | Verdict |
|---------------|------|------|---------------|-----|---------------|---------|
| **Better Auth** | Library (self-hosted) | Free | 5 (full code) | TOTP, WebAuthn | Native | **Selected** |
| Supabase Auth | BaaS | Free tier | 3 (config) | TOTP | Native | Lock-in |
| Clerk | BaaS | $25/mo | 4 (components) | TOTP, WebAuthn | Native | Cost at scale |
| Auth0 | BaaS | $23/mo | 4 | All | Native | Expensive |
| NextAuth v5 | Library | Free | 4 | TOTP | Manual | Complex orgs |
| Lucia | Library | Free | 5 | TOTP | Manual | No org support |
| Custom (JWT) | Library | Free | 5 | Manual | Manual | High risk |

**Better Auth selected:**
- **Type-safe** — Generates types from schema
- **Framework-agnostic** — Works with Hono, Next.js, any Fetch API
- **Organizations (multi-tenancy) built-in** — Invitations, roles, metadata
- **Plugins:** `twoFactor`, `passkey`, `organization`, `admin`, `emailOTP`
- **Self-hosted** — Own the data, no per-MAU costs
- **Session management:** Database sessions + JWT access tokens with rotation

---

## 6. API Layer

### 6.1 REST: Hono + Zod + OpenAPI (Hono Zod OpenAPI)

```typescript
// Example: Type-safe route with validation + OpenAPI
const createProductRoute = createRoute({
  method: 'post',
  path: '/products',
  request: {
    body: { content: { 'application/json': { schema: CreateProductSchema } } },
  },
  responses: {
    201: { content: { 'application/json': { schema: ProductSchema } } },
    400: { content: { 'application/json': { schema: ErrorSchema } } },
    401: { content: { 'application/json': { schema: ErrorSchema } } },
  },
});

app.openapi(createProductRoute, async (c) => {
  const body = c.req.valid('json'); // Zod-validated
  const product = await productService.create(body, c.get('orgId'));
  return c.json(product, 201);
});
```

**Benefits:**
- Single source of truth: Zod schema → validation + types + OpenAPI
- Generates OpenAPI 3.1 spec → Scalar docs, TypeScript client, Postman collection
- Works in Cloudflare Workers (no Node.js APIs)

### 6.2 GraphQL: GraphQL Yoga (Hono Integration) — For Complex Queries

- **Use case:** Dashboard widgets, custom reports, mobile app (single query)
- **Schema:** Code-first (Pothos) → Type-safe resolvers
- **DataLoader** — Batched loading for N+1 prevention
- **Subscriptions** — Over WebSocket (Supabase Realtime or custom)

### 6.3 API Versioning

- **Header-based:** `Accept: application/vnd.stokku.v1+json`
- **Default:** Latest stable (v1)
- **Deprecation:** 12-month notice, `Sunset` header, migration guide

---

## 7. Development & Build Tooling

| Tool | Purpose | Why |
|------|---------|-----|
| **Turborepo** | Monorepo build system | Remote caching, task orchestration, affected builds |
| **pnpm** | Package manager | Fast, disk-efficient, strict peer deps |
| **TypeScript** | Type checking | `strict: true`, project references |
| **ESLint** | Linting | `eslint.config.js` (flat), `typescript-eslint`, `react-hooks`, `tailwindcss` |
| **Prettier** | Formatting | `prettier-plugin-tailwindcss`, `prettier-plugin-organize-imports` |
| **Husky + lint-staged** | Pre-commit hooks | Fast, only staged files |
| **Commitlint** | Conventional Commits | Enforced in CI |
| **Changesets** | Versioning + Changelog | Monorepo-friendly, GitHub integration |
| **Vitest** | Unit/Integration tests | Vite-native, fast, Jest-compatible API |
| **Playwright** | E2E tests | Cross-browser, reliable, trace viewer |
| **MSW** | API Mocking | Service worker + Node, same handlers for tests/dev |
| **Storybook** | Component docs | Visual testing, Chromatic integration |
| **Knip** | Dead code detection | Unused exports, dependencies, files |

---

## 8. CI/CD & Deployment

| Stage | Tool | Configuration |
|-------|------|---------------|
| **CI** | GitHub Actions | `turbo run lint typecheck test build` |
| **Preview** | Cloudflare Pages | Auto on PR, unique URL, env vars from GitHub Environments |
| **Production** | Cloudflare Pages + Workers | Auto on merge to `main`, staged rollout |
| **Database Migrations** | GitHub Actions + Neon | Branch → migrate → test → promote |
| **Secrets** | GitHub Environments + Cloudflare Workers Secrets | No plaintext in repo |
| **Dependency Updates** | Dependabot + Renovate | Grouped PRs, auto-merge patch |

---

## 9. Monitoring & Observability

| Layer | Tool | Cost | Notes |
|-------|------|------|-------|
| **Errors** | Sentry (Team) | $26/mo | Frontend + Backend, source maps, replay |
| **Logs** | Cloudflare Logs / Loki | Free / $ | Structured JSON, queryable |
| **Metrics** | Cloudflare Analytics + Custom | Free | Workers metrics, custom Prometheus |
| **Traces** | Cloudflare Workers Traces | Free | W3C TraceContext |
| **Uptime** | Better Uptime / UptimeRobot | Free | Synthetic checks, status page |
| **Database** | Neon Dashboard + pg_stat_statements | Included | Query performance, index advisor |

---

## 10. Security Tooling

| Tool | Purpose | Integration |
|------|---------|-------------|
| **CodeQL** | SAST | GitHub Actions (default) |
| **npm audit / pnpm audit** | Dependency scanning | CI gate |
| **Trivy** | Container/FS scanning | CI (Docker images) |
| **Gitleaks** | Secret scanning | Pre-commit + CI |
| **OWASP ZAP** | DAST | Staging environment, scheduled |
| **Dependabot** | Dependency updates | Auto-PR, grouped |

---

## 11. Documentation

| Artifact | Tool | Audience |
|----------|------|----------|
| **API Reference** | Scalar (OpenAPI) | External developers |
| **Architecture** | Markdown (`docs/architecture.md`) | Engineers |
| **ADRs** | Markdown (`docs/adr/`) | Engineers |
| **Components** | Storybook + Chromatic | Designers, Engineers |
| **Runbooks** | Markdown (`docs/runbooks/`) | On-call |
| **Onboarding** | `DEVELOPMENT.md`, `CONTRIBUTING.md` | New hires |

---

## 12. Summary: Final Stack Decision

| Layer | Choice | Key Reason |
|-------|--------|------------|
| **Compute** | Cloudflare Workers (Hono) | Edge, zero cold start, TypeScript, cost |
| **Database** | Neon PostgreSQL | Serverless PG, branching, autoscaling, standard SQL |
| **Cache/PubSub** | Upstash Redis | HTTP API, global, pay-per-request |
| **Auth** | Better Auth | Self-hosted, orgs, MFA, type-safe, free |
| **Real-time** | Supabase Realtime (self-hosted) | PostgreSQL CDC, WebSocket, managed option |
| **Frontend** | Next.js 15 (App Router) | RSC, streaming, edge, ecosystem |
| **Styling** | Tailwind CSS v4 + CSS Variables | Performance, theming, DX |
| **UI Primitives** | Radix UI (custom `@stokku/ui`) | Accessibility, uncontrolled, composable |
| **Server State** | TanStack Query v5 | Caching, optimistic, mutations |
| **Client State** | Zustand | Minimal, TypeScript, no providers |
| **Forms** | React Hook Form + Zod | Performance, validation |
| **API (REST)** | Hono + Zod OpenAPI | Type-safe, OpenAPI generation |
| **API (GraphQL)** | GraphQL Yoga + Pothos | Complex queries, subscriptions |
| **Monorepo** | Turborepo + pnpm | Caching, affected builds |
| **Testing** | Vitest + Playwright + MSW | Fast, reliable, shared mocks |
| **CI/CD** | GitHub Actions | Native, OIDC, free for public |
| **Observability** | Sentry + Cloudflare Logs | Errors, logs, traces, metrics |
| **Security** | CodeQL + Gitleaks + Dependabot | Shift-left |

---

## 13. Rejected Alternatives (with reasons)

| Technology | Rejected Because |
|------------|------------------|
| **Supabase as backend** | Lock-in, limited business logic, PostgREST not enough for PO/stock workflows |
| **Firebase** | NoSQL, vendor lock-in, cost at scale, no relational integrity |
| **Appwrite** | Self-hosted ops burden, smaller ecosystem, less mature |
| **Convex** | Proprietary, no SQL, vendor lock-in, pricing |
| **PocketBase** | Go/SQLite, not PostgreSQL, limited scaling |
| **Nhost** | Hasura complexity, GraphQL-only, less control |
| **Railway/Render/Fly.io for API** | Higher cost, more ops, cold starts (Node), no edge |
| **Vercel Edge Functions** | Vendor lock-in, limited runtime, pricing |
| **tRPC** | No OpenAPI, no public API support, tied to React |
| **Prisma** | Runtime overhead, slower, less control over SQL |
| **Drizzle only (no Neon)** | Need managed PG with branching/PITR |
| **shadcn/ui as dependency** | Copy-paste philosophy — own your design system |
| **Redux / MobX / Jotai** | Overkill for client state; Zustand is simpler |
| **NextAuth v5** | Complex org support, middleware confusion |
| **Clerk** | Per-MAU pricing, component lock-in |

---

*End of Technology Stack Evaluation*

*Next: Database Design (ERD, Schema, Migrations, Indexes)*