# Feature Inventory
## Stokku Legacy Application — Complete Feature Catalog for Rebuild Reference

**Version:** 2.0  
**Status:** Draft — For Engineering Review  
**Classification:** Internal — Engineering Team Only

---

## Overview

This document catalogs every user-facing feature, internal capability, and technical function discovered in the legacy Stokku application (v0.dev prototype). Each feature is classified by **Rebuild Disposition**:

| Disposition | Meaning |
|-------------|---------|
| **REBUILD** | Core feature — implement in v2 with modern architecture |
| **ENHANCE** | Exists but needs significant improvement (UX, scalability, correctness) |
| **DEFER** | Valid but postpone to post-GA (P2/P3) |
| **REMOVE** | Prototype artifact, technical debt, or anti-pattern — do not carry forward |
| **REPLACE** | Concept valid but implementation fundamentally flawed — redesign from scratch |

---

## 1. Authentication & User Management

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Email/Password Sign Up | Supabase Auth + custom profile trigger | REBUILD | Use Better Auth; add email verification enforcement |
| Email/Password Sign In | Supabase Auth | REBUILD | Better Auth with rate limiting, breach detection |
| Google OAuth | Supabase Auth (configured) | REBUILD | Better Auth multi-provider support |
| Password Reset | Supabase Auth (email link) | REBUILD | Better Auth; add token expiry, single-use |
| Email Verification | Supabase Auth (trigger) | REBUILD | Better Auth; enforce before dashboard access |
| Session Management | Supabase JWT (client-side) | REPLACE | HttpOnly cookies + refresh token rotation |
| User Profile (name, role) | `profiles` table + RLS | REBUILD | Extend with avatar, phone, preferences, timezone |
| Role-Based Access (Admin/User) | `role` column + RLS policies | ENHANCE | Expand to 4 roles: Admin, Manager, Staff, Viewer |
| Multi-tenancy (Organization) | **Missing** — single org only | REBUILD | Core requirement — org_id on all tables |
| Team Invitations | **Missing** | REBUILD | Email invite with role, expiry, audit log |
| Two-Factor Auth (TOTP) | **Missing** | DEFER | P1 — Better Auth supports |
| Session/Device Management | **Missing** | DEFER | P1 — view/revoke active sessions |
| SSO (SAML/OIDC) | **Missing** | DEFER | P2 — Enterprise tier |

---

## 2. Organization & Settings

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Organization Creation | On signup (implicit) | REBUILD | Explicit org creation flow |
| Organization Switcher | **Missing** | REBUILD | Header dropdown for multi-org users |
| Organization Settings | **Missing** | REBUILD | Name, logo, timezone, currency, date format |
| Warehouse/Location Management | **Missing** | REBUILD | Hierarchical locations (zone → aisle → bin) |
| Category Management | `categories` table + admin UI | REBUILD | Hierarchical categories; slug, icon, color |
| Unit of Measure | **Missing** | DEFER | P1 — base unit + conversions (box=12 pcs) |
| Tax Configuration | **Missing** | DEFER | P2 — rates, groups, exemptions |
| Document Numbering | **Missing** | REBUILD | Prefix + sequence (PO-0001, SO-0001) |
| Custom Fields | **Missing** | DEFER | P2 — key-value on products, suppliers, customers |
| Branding/White-label | **Missing** | REMOVE | Not in scope |

---

## 3. Product Catalog

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Product CRUD | Full (name, SKU, description, category, supplier, price, cost, qty, min_qty, image) | REBUILD | Add validation, unique SKU enforcement, slug |
| Product Variants (Size/Color) | **Missing** — single SKU only | REBUILD | Parent product + variants with unique SKUs |
| Product Images | Single `image_url` | ENHANCE | Multiple images, drag-drop reorder, primary marker |
| Barcode/QR Generation | **Missing** | REBUILD | EAN-13, UPC-A, Code128; print labels |
| Barcode Scanning | **Missing** | REBUILD | Camera API (PWA) + hardware scanner support |
| Product Search/Filter | Client-side filter (ProductSearchFilter) | REPLACE | Server-side search (PostgreSQL FTS + trigram) |
| Product Status (In/Low/Out) | Computed client-side | REBUILD | Server-computed, real-time, webhook on change |
| Min/Max Stock Levels | `min_quantity` only | ENHANCE | Add `reorder_point`, `reorder_quantity`, `max_stock` |
| Product Bundles/Kits (BOM) | **Missing** | DEFER | P1 — phantom BOM for kits, stock auto-deduct |
| Lot/Serial Tracking | **Missing** | DEFER | P1 — optional per product |
| Expiry Date Tracking | **Missing** | DEFER | P1 — FEFO alerts, auto-expire |
| Custom Attributes | **Missing** | DEFER | P2 — EAV or JSONB |
| Archive/Restore (Soft Delete) | Hard delete only | REBUILD | `deleted_at` timestamp, admin restore |
| Bulk Import (CSV/Excel) | ImportExportManager (client-only, sample data) | REPLACE | Server-side, streaming, validation preview, dry-run |
| Bulk Export (CSV/Excel) | ImportExportManager (client-only) | REPLACE | Server-side, background job, email link |
| Product Duplication | **Missing** | REBUILD | "Duplicate" action with SKU suffix |

---

## 4. Inventory Management

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Real-time Stock Levels | Client state + Supabase (not realtime) | REBUILD | TanStack Query + WebSocket (Supabase Realtime / Ably) |
| Multi-location Stock | **Missing** | REBUILD | `stock_levels` table: org, warehouse, variant, qty |
| Stock Adjustments (In/Out) | `transactions` table + manual modal | REPLACE | Immutable `stock_movements` ledger with reason codes |
| Stock Adjustment Reasons | Free-text `reason` field | REBUILD | Enum reason codes + custom note |
| Batch Stock Entry | **Missing** | REBUILD | Grid entry, barcode scan, paste from spreadsheet |
| Stock Reservations | **Missing** | REBUILD | `reserved_qty` on stock_levels; allocate on SO confirm |
| Inter-location Transfers | **Missing** | DEFER | P1 — transfer order → ship → receive → in-transit |
| Cycle Count / Physical Inventory | **Missing** | DEFER | P1 — count sheets, variance approval, adjustment |
| ABC Analysis | **Missing** | DEFER | P2 — auto-classify by velocity/value |
| Reorder Alerts | Client-side computed badges | REBUILD | Server-side evaluation, real-time push notification |
| Suggested PO Generation | **Missing** | REBUILD | From reorder points + lead time + safety stock |
| Stock Valuation (FIFO/WAC) | **Missing** | REBUILD | Cost layer tracking per variant per location |
| Inventory Audit Log | `transactions` (mutable, incomplete) | REPLACE | Immutable append-only ledger with user, timestamp, before/after |

---

## 5. Supplier Management

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Supplier CRUD | Full (name, contact, email, address, status, reliability, categories[], notes) | REBUILD | Normalize categories (FK), add payment terms, currency |
| Supplier Product Catalog | `suppliers.categories` TEXT[] (denormalized) | REPLACE | `supplier_products` table: supplier SKU, lead time, MOQ, price tiers |
| Supplier Performance Scorecard | **Missing** (AdminDashboard has reliability fields but no computation) | REBUILD | On-time %, defect %, fill rate, lead time variance, trend |
| Preferred/Alternate Supplier | **Missing** | REBUILD | Per product/variant designation |
| Supplier Portal | **Missing** | DEFER | P2 — view POs, confirm receipt, update tracking |
| Supplier Communication Log | **Missing** | DEFER | P2 — email thread, notes, attachments |
| Supplier Risk Assessment | **Missing** | DEFER | P3 — financial health, concentration risk |

---

## 6. Purchase Orders

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| PO Creation | **Missing** (AdminDashboard has stock movement entry only) | REBUILD | From reorder suggestions or manual |
| PO Line Items | **Missing** | REBUILD | Product, variant, qty, unit cost, tax, discount |
| PO Status Lifecycle | **Missing** | REBUILD | Draft → Sent → Confirmed → Partial/Full Received → Closed/Cancelled |
| Email PO to Supplier | **Missing** | REBUILD | Template + PDF attachment; track opens |
| PO Receive (Partial/Full) | **Missing** | REBUILD | Scan receipt, qty variance, quality check (pass/fail/quarantine) |
| Three-way Matching | **Missing** | DEFER | P2 — PO ↔ Receipt ↔ Invoice |
| Blanket/Recurring PO | **Missing** | DEFER | P1 — schedule, release against blanket |
| PO History & Audit | **Missing** | REBUILD | Immutable status log, user attribution |
| PO Approval Workflow | **Missing** | DEFER | P1 — threshold-based approval chain |
| Landed Cost Calculation | **Missing** | DEFER | P2 — freight, duty, insurance allocation |

---

## 7. Sales & Orders

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Sales Order Creation | **Missing** | REBUILD | Customer, lines, pricing, shipping address |
| Stock Reservation on SO | **Missing** | REBUILD | Allocate available → reserved; release on cancel/ship |
| Pick/Pack/Ship Workflow | **Missing** | DEFER | P1 — mobile pick list, pack slip, label print |
| Customer Management | **Missing** | REBUILD | B2B: net terms, credit limit, price list; B2C: quick sale |
| Price Lists / Tiered Pricing | **Missing** | DEFER | P1 — customer-specific, volume breaks |
| Backorder Management | **Missing** | DEFER | P1 — track, notify, partial ship |
| Return/RMA Processing | **Missing** | DEFER | P2 — authorize, receive, inspect, restock/refund |
| POS Integration | **Missing** | DEFER | P1 — webhooks from Square, Toast, Shopify POS |
| E-commerce Integration | **Missing** | DEFER | P1 — Shopify, WooCommerce, BigCommerce sync |

---

## 8. Reporting & Analytics

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Dashboard Overview | DashboardOverview (static charts, computed client-side) | REPLACE | Real-time widgets: KPIs, alerts, charts, activity feed |
| Inventory Valuation Report | **Missing** | REBUILD | FIFO, WAC, specific ID; per location, category |
| Stock Movement Report | **Missing** (AdminDashboard has localStorage movements) | REBUILD | Filter by date, type, product, location, user; export |
| Low Stock / Reorder Report | Client-side filter (low-stock view) | REBUILD | Server-side, suggested PO qty, supplier grouping |
| Supplier Performance Dashboard | **Missing** (AdminDashboard has static supplier list) | REBUILD | Scorecards, trends, benchmarking, export |
| Sales Velocity / Demand Forecast | **Missing** | DEFER | P2 — simple moving average, seasonal adjustment |
| Custom Report Builder | ReportsView (placeholder only) | DEFER | P1 — drag-drop, saved views, scheduled |
| Scheduled Report Delivery | **Missing** | REBUILD | Email (CSV/PDF), webhook, SFTP; daily/weekly/monthly |
| Real-time Analytics API | **Missing** | REBUILD | GraphQL subscriptions for dashboard widgets |
| Cohort / Retention Analysis | **Missing** | DEFER | P3 — product/customer cohorts |

---

## 9. Notifications & Alerts

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| In-app Notification Center | **Missing** (toast only via sonner) | REBUILD | Bell icon, history, mark read, preferences |
| Email Notifications | **Missing** | REBUILD | Low stock, PO status, overdue receipt, scheduled reports |
| Push Notifications (PWA) | **Missing** | DEFER | P1 — Service Worker + Web Push (VAPID) |
| Slack/Teams Webhooks | **Missing** | DEFER | P1 — incoming webhook per channel |
| Alert Rules Engine | **Missing** | DEFER | P2 — custom thresholds, escalation |
| Digest Emails | **Missing** | DEFER | P1 — daily/weekly summary |

---

## 10. User Experience & Interface

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Responsive Layout | Sidebar + content (desktop only) | REPLACE | Mobile-first: bottom nav, drawers, responsive tables |
| Dark/Light Mode | next-themes + CSS variables (partial) | REBUILD | Complete design tokens, system preference, manual toggle |
| Design System | Raw Radix UI (40+ components, no wrappers) | REPLACE | Custom design system: tokens, primitives, patterns |
| Global Search (Cmd+K) | **Missing** | REBUILD | Products, suppliers, POs, customers, settings |
| Keyboard Shortcuts | **Missing** | REBUILD | `?` for help, `n` new, `/` search, `esc` close |
| Loading/Skeleton States | Spinner only | REBUILD | Skeleton screens, progressive hydration |
| Empty States | Basic text | REBUILD | Illustrated, actionable CTAs |
| Error Boundaries | **Missing** | REBUILD | Per-feature boundaries, recovery actions |
| Optimistic Updates | None (await all mutations) | REBUILD | TanStack Query mutations with rollback |
| PWA (Installable, Offline) | **Missing** | REBUILD | Manifest, SW, offline read, background sync writes |
| Barcode Scanner (Camera) | **Missing** | REBUILD | `@zxing/browser` or QuaggaJS |
| Drag & Drop | **Missing** | REBUILD | Kanban PO board, image reorder, table row reorder |
| Virtualized Tables | **Missing** (renders all rows) | REBUILD | `@tanstack/react-virtual` for 10k+ rows |
| Print Stylesheets | **Missing** | REBUILD | PO, pick list, count sheet, labels |

---

## 11. Platform & Infrastructure

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| REST API | **Missing** (direct Supabase from client) | REBUILD | Hono on Cloudflare Workers, OpenAPI 3.1 |
| GraphQL API | **Missing** | REBUILD | GraphQL Yoga, federation-ready |
| Webhooks | **Missing** | REBUILD | Retry with backoff, signature verification, dead letter |
| API Keys / PATs | **Missing** | REBUILD | Scoped tokens, rotation, audit |
| Rate Limiting | **Missing** | REBUILD | Per-org, per-endpoint, sliding window |
| API Versioning | **Missing** | REBUILD | Header-based (`Accept: application/vnd.stokku.v1+json`) |
| SDK Generation | **Missing** | DEFER | P2 — TypeScript, Python, Go from OpenAPI |
| Database Migrations | Raw SQL file (`schema.sql`) | REPLACE | Drizzle Kit, versioned, reversible, CI-gated |
| Structured Logging | `console.log` / `console.error` | REPLACE | Pino JSON, correlation IDs, Cloudflare Logs |
| Distributed Tracing | **Missing** | REBUILD | W3C TraceContext, Cloudflare Workers tracing |
| Error Tracking | **Missing** | REBUILD | Sentry (frontend + backend) |
| Metrics/Monitoring | **Missing** | REBUILD | Prometheus-format, Cloudflare Analytics, custom dashboards |
| Health Checks | **Missing** | REBUILD | `/health` (liveness), `/ready` (readiness) |
| Feature Flags | **Missing** | DEFER | P1 — LaunchDarkly-style, per-org rollout |
| Audit Log (Security) | **Missing** | REBUILD | Immutable, tamper-evident, queryable |
| Backup/Point-in-Time Recovery | Supabase managed (not controlled) | REBUILD | Neon branching + scheduled dumps, tested restore |

---

## 12. Developer Experience

| Feature | Legacy Implementation | Disposition | Notes |
|---------|----------------------|-------------|-------|
| Monorepo | Single Next.js app | REBUILD | Turborepo: apps/web, apps/api, packages/* |
| Type Safety | Partial (any, loose types) | REBUILD | Strict TS, shared types package, codegen from OpenAPI |
| Testing | **None** | REBUILD | Vitest (unit), Playwright (E2E), MSW (mocks) |
| Storybook | **Missing** | REBUILD | Design system docs, visual regression (Chromatic) |
| CI/CD | **Missing** | REBUILD | GitHub Actions: lint, typecheck, test, build, deploy preview |
| Preview Deployments | Vercel auto (from v0.dev) | REBUILD | Cloudflare Pages + Workers preview per PR |
| Secrets Management | `.env.local` (committed!) | REBUILD | GitHub Environments + Cloudflare Workers secrets |
| Local Development | `next dev` only | REBUILD | Docker Compose: API, DB, Redis, Mailpit, MinIO |
| API Documentation | **Missing** | REBUILD | Scalar/OpenAPI, auto-generated from code |
| Database Seeding | `sample-data.ts` (client-side) | REBUILD | Drizzle seed scripts, deterministic, idempotent |
| Code Quality Gates | ESLint basic, no pre-commit | REBUILD | Husky + lint-staged, Conventional Commits, Commitlint |

---

## 13. Legacy Artifacts — EXPLICITLY REMOVED

| Feature | Reason for Removal |
|---------|-------------------|
| Sample Data Mode (`USE_SUPABASE` flag) | Prototype artifact; replace with seeded demo organization |
| Dual DataService (Supabase + localStorage) | Architecture violation; single source of truth |
| LocalStorage for Sales Targets | Data loss risk; move to database with API |
| LocalStorage for Stock Movements | No audit trail; replace with immutable ledger |
| `CategoriesDebug` component | Dev tool; replace with admin observability |
| `supplier` TEXT column on products | Denormalized legacy; use `supplier_id` FK only |
| `suppliers.categories` TEXT[] | Not queryable; normalize to `supplier_categories` join table |
| Static v0.dev Landing Page | Marketing site separate from app |
| Radix UI used raw (no design system) | Inconsistent; build wrapper components |
| `DataService.getDataSource()` UI badge | Leaks implementation detail to users |
| `AdminDashboard` localStorage features | All move to proper backend APIs |
| Client-side only Import/Export | No validation, no server processing; replace with jobs |

---

## 14. Feature Traceability Matrix

| Rebuild Feature | Legacy Source | PRD Requirement | Priority |
|-----------------|---------------|-----------------|----------|
| Multi-tenant Auth | — | FR-AUTH-06 | P0 |
| Product Variants | — | FR-PROD-02 | P0 |
| Stock Movements Ledger | `transactions` table | FR-INV-10 | P0 |
| Purchase Order Workflow | — | FR-PO-01 to FR-PO-06 | P0 |
| Supplier Scorecards | `suppliers.reliability` fields | FR-SUP-03 | P0 |
| Real-time Dashboard | `DashboardOverview` | FR-RPT-01 | P0 |
| REST/GraphQL API | — | API Design | P0 |
| Mobile PWA | — | NFR-A11Y, Mobile-first | P0 |
| Design System | Radix UI components | UI/UX Strategy | P0 |
| Automated Testing | — | Code Quality | P1 |
| Scheduled Reports | — | FR-RPT-07 | P1 |
| Webhooks | — | API Design | P1 |
| Cycle Count | — | FR-INV-07 | P1 |
| Bundles/Kits | — | FR-PROD-06 | P2 |

---

## 15. Summary Statistics

| Category | Legacy Features | Rebuild (P0) | Enhance | Defer | Remove |
|----------|-----------------|--------------|---------|-------|--------|
| Authentication | 4 | 6 | 1 | 3 | 0 |
| Organization | 1 | 7 | 0 | 2 | 0 |
| Product Catalog | 7 | 12 | 2 | 5 | 1 |
| Inventory | 4 | 11 | 1 | 4 | 0 |
| Suppliers | 2 | 5 | 1 | 3 | 0 |
| Purchase Orders | 1 | 7 | 0 | 3 | 0 |
| Sales/Orders | 0 | 5 | 0 | 4 | 0 |
| Reports/Analytics | 3 | 7 | 0 | 3 | 0 |
| Notifications | 1 | 3 | 0 | 3 | 0 |
| UI/UX | 3 | 12 | 0 | 0 | 0 |
| Platform/Infra | 0 | 14 | 0 | 2 | 0 |
| Developer Experience | 0 | 9 | 0 | 0 | 0 |
| **TOTAL** | **26** | **98** | **5** | **32** | **1** |

**Net New Features (P0 only): 72** — The rebuild is not a migration; it's a new product.

---

*End of Feature Inventory*