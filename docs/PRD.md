# Product Requirements Document (PRD)
## Stokku — Inventory Management System

**Version:** 2.0 (Rebuild)  
**Status:** Draft — For Engineering Review  
**Classification:** Internal — Engineering Team Only

---

## 1. Executive Summary

### 1.1 Product Vision
Stokku is a modern, multi-tenant SaaS inventory management platform designed for small-to-medium businesses (SMBs) that need real-time stock visibility, supplier management, purchase order tracking, and actionable analytics — without the complexity and cost of enterprise ERPs.

### 1.2 Problem Statement
SMBs managing physical inventory face:
- **Stockouts & Overstock**: No real-time visibility → lost sales or tied-up capital
- **Manual Processes**: Spreadsheets, paper records, disconnected tools → errors, no audit trail
- **Supplier Blindness**: No performance tracking → unreliable deliveries, poor negotiation leverage
- **No Single Source of Truth**: Data scattered across tools → reporting is manual, delayed, error-prone
- **Cost Prohibitive ERPs**: NetSuite, SAP B1, Odoo too expensive/complex for SMBs

### 1.3 Solution
A purpose-built, mobile-first inventory management SaaS with:
- Real-time stock levels with automated low-stock alerts
- Supplier performance scoring & purchase order lifecycle management
- Role-based access (Admin, Manager, Staff, Viewer)
- Audit-ready transaction log with immutable history
- Embedded analytics (sales trends, stock turns, supplier scorecards)
- REST + GraphQL API for integrations (POS, e-commerce, accounting)
- Mobile-first PWA for warehouse floor usage

---

## 2. Target Users & Personas

| Persona | Role | Primary Goals | Pain Points |
|---------|------|---------------|-------------|
| **Owner/Founder** | Decision maker | Cash flow visibility, profitability, growth | No real-time data, reactive decisions |
| **Warehouse Manager** | Operations | Accurate counts, efficient picking/packing, low stock alerts | Paper-based, errors, no mobile access |
| **Procurement Officer** | Purchasing | Supplier performance, PO tracking, cost control | Manual PO tracking, no supplier scorecards |
| **Sales/Store Staff** | Frontline | Quick stock lookup, reserve for customers | Slow search, no mobile access |
| **Accountant/Finance** | Reporting | COGS, inventory valuation, audit trail | Manual exports, no integration |

---

## 3. Core User Workflows

### 3.1 Inventory Management
```
[Receive PO] → [Update Stock] → [Auto-recalc Status] → [Trigger Low-Stock Alert]
                    ↓
[Sales Order] → [Reserve Stock] → [Pick/Pack] → [Ship] → [Update Stock]
```

### 3.2 Procurement Workflow
```
[Low Stock Alert] → [Create PO] → [Send to Supplier] → [Track Delivery]
                                                    ↓
                                           [Receive] → [Quality Check] → [Update Stock]
                                                    ↓
                                           [Update Supplier Scorecard]
```

### 3.3 Reporting & Analytics
```
[Time Range + Filters] → [Generate Report] → [Export/Schedule/Share]
                              ↓
                       [Dashboard Widgets]
```

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Email/Password registration with email verification | P0 |
| FR-AUTH-02 | Google OAuth 2.0 / OIDC | P0 |
| FR-AUTH-03 | JWT-based session management (access + refresh tokens) | P0 |
| FR-AUTH-04 | Password reset via secure email token | P0 |
| FR-AUTH-05 | Role-Based Access Control (RBAC): Admin, Manager, Staff, Viewer | P0 |
| FR-AUTH-06 | Organization-level multi-tenancy (data isolation) | P0 |
| FR-AUTH-07 | Invite team members with role assignment | P1 |
| FR-AUTH-08 | Two-Factor Authentication (TOTP) | P1 |
| FR-AUTH-09 | Session management (view/revoke devices) | P1 |

### 4.2 Organization & Tenancy (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORG-01 | Create organization on signup | P0 |
| FR-ORG-02 | Switch between organizations (if member of multiple) | P1 |
| FR-ORG-03 | Organization settings: name, timezone, currency, date format, logo | P1 |
| FR-ORG-04 | Billing subscription management (Stripe integration) | P2 |

### 4.3 Product Catalog (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROD-01 | CRUD products: name, SKU (unique), description, category, unit of measure | P0 |
| FR-PROD-02 | Variants: size, color, style with unique SKUs per variant | P0 |
| FR-PROD-03 | Product images (multiple, drag-drop reorder, primary image) | P1 |
| FR-PROD-04 | Barcode/QR code generation & scanning (EAN-13, UPC, Code128) | P1 |
| FR-PROD-05 | Custom fields (key-value) for extensibility | P2 |
| FR-PROD-06 | Bundles/kits (bill of materials) | P2 |
| FR-PROD-07 | Archive/restore (soft delete) | P1 |
| FR-PROD-08 | Bulk import/export (CSV, Excel) with validation preview | P1 |

### 4.4 Inventory Tracking (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INV-01 | Real-time stock levels per location/warehouse | P0 |
| FR-INV-02 | Stock movements: IN (receipt, adjustment +), OUT (sale, adjustment -, transfer) | P0 |
| FR-INV-03 | Automatic status: In Stock / Low Stock / Out of Stock / On Order | P0 |
| FR-INV-04 | Configurable reorder points per product/location | P0 |
| FR-INV-05 | Stock reservations (allocated for pending orders) | P1 |
| FR-INV-06 | Inter-location transfers with in-transit tracking | P1 |
| FR-INV-07 | Cycle count / physical inventory workflow | P1 |
| FR-INV-08 | Lot/serial number tracking (optional per product) | P2 |
| FR-INV-09 | Expiry date tracking with FEFO alerts | P2 |
| FR-INV-10 | Immutable audit log for all stock changes | P0 |

### 4.5 Supplier Management (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SUP-01 | CRUD suppliers: name, contact, email, phone, address, payment terms | P0 |
| FR-SUP-02 | Supplier product catalog (supplier SKU, lead time, MOQ, price tiers) | P0 |
| FR-SUP-03 | Supplier performance scorecard: on-time rate, defect rate, fill rate, lead time variance | P1 |
| FR-SUP-04 | Preferred/alternate supplier designation per product | P1 |
| FR-SUP-05 | Supplier portal (view POs, update delivery status) | P2 |

### 4.6 Purchase Orders (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PO-01 | Create PO from low-stock suggestions or manual entry | P0 |
| FR-PO-02 | PO status lifecycle: Draft → Sent → Confirmed → Partial/Full Received → Closed | P0 |
| FR-PO-03 | Email PO to supplier (template, PDF attachment) | P1 |
| FR-PO-04 | Receive against PO (partial receipts, quantity variance, quality check) | P0 |
| FR-PO-05 | Three-way matching: PO ↔ Receipt ↔ Invoice | P2 |
| FR-PO-06 | PO history & audit trail | P0 |
| FR-PO-07 | Recurring/blanket POs | P2 |

### 4.7 Sales & Orders (P1)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SO-01 | Create sales orders (customer, line items, pricing) | P1 |
| FR-SO-02 | Stock reservation on confirmed orders | P1 |
| FR-SO-03 | Pick/Pack/Ship workflow with mobile scanning | P1 |
| FR-SO-04 | Customer management (B2B: net terms, credit limit; B2C: quick sale) | P1 |
| FR-SO-05 | Price lists / tiered pricing per customer | P2 |
| FR-SO-06 | Integration hooks for Shopify, WooCommerce, POS | P2 |

### 4.8 Reporting & Analytics (P0)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RPT-01 | Real-time dashboard: stock value, turns, days of supply, stockout rate | P0 |
| FR-RPT-02 | Inventory valuation (FIFO, weighted average) | P1 |
| FR-RPT-03 | Stock movement report (in/out/transfer by period, product, location) | P0 |
| FR-RPT-04 | Low stock / reorder report with suggested PO quantities | P0 |
| FR-RPT-05 | Supplier performance dashboard | P1 |
| FR-RPT-06 | Sales velocity & demand forecasting (simple moving average) | P2 |
| FR-RPT-07 | Scheduled email reports (daily/weekly/monthly) | P1 |
| FR-RPT-08 | Export all reports to CSV/Excel/PDF | P1 |
| FR-RPT-09 | Custom report builder (drag-drop) | P2 |

### 4.9 Notifications & Alerts (P1)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOT-01 | Real-time in-app notifications (bell icon) | P1 |
| FR-NOT-02 | Email notifications: low stock, PO status, overdue receipts | P1 |
| FR-NOT-03 | Push notifications (PWA) for mobile | P2 |
| FR-NOT-04 | Slack / Microsoft Teams webhook integration | P2 |
| FR-NOT-05 | Notification preferences per user/role | P1 |

### 4.10 Settings & Configuration (P1)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SET-01 | Warehouse/location management (hierarchical) | P1 |
| FR-SET-02 | Category management (hierarchical) | P1 |
| FR-SET-03 | Unit of measure management (conversions) | P1 |
| FR-SET-04 | Tax rates & tax groups | P2 |
| FR-SET-05 | Currency & exchange rates (multi-currency) | P2 |
| FR-SET-06 | Custom document numbering sequences | P1 |

---

## 5. Non-Functional Requirements

### 5.1 Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Dashboard load (p95) | < 1.5s |
| NFR-PERF-02 | Product list (10k items, paginated) | < 500ms |
| NFR-PERF-03 | Stock adjustment write latency | < 200ms |
| NFR-PERF-04 | API p95 latency (read) | < 300ms |
| NFR-PERF-05 | API p95 latency (write) | < 500ms |

### 5.2 Scalability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-01 | Support 10,000+ products per organization | ✅ |
| NFR-SCALE-02 | Support 100+ concurrent users per organization | ✅ |
| NFR-SCALE-03 | Multi-region deployment (US, EU, APAC) | P2 |
| NFR-SCALE-04 | Horizontal scaling (stateless API, read replicas) | ✅ |

### 5.3 Reliability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | Uptime SLA | 99.9% |
| NFR-REL-02 | RPO (Recovery Point Objective) | < 1 hour |
| NFR-REL-03 | RTO (Recovery Time Objective) | < 4 hours |
| NFR-REL-04 | Automated backups (daily + point-in-time) | ✅ |

### 5.4 Security
| ID | Requirement | Standard |
|----|-------------|----------|
| NFR-SEC-01 | Data encryption at rest (AES-256) | ✅ |
| NFR-SEC-02 | Data encryption in transit (TLS 1.3) | ✅ |
| NFR-SEC-03 | OWASP Top 10 compliance | ✅ |
| NFR-SEC-04 | SOC 2 Type II readiness | P1 |
| NFR-SEC-05 | GDPR compliance (data export, deletion) | P1 |
| NFR-SEC-06 | Rate limiting (API: 1000 req/min/user) | ✅ |
| NFR-SEC-07 | Audit logging (immutable, tamper-evident) | ✅ |

### 5.5 Accessibility
| ID | Requirement | Standard |
|----|-------------|----------|
| NFR-A11Y-01 | WCAG 2.1 AA compliance | ✅ |
| NFR-A11Y-02 | Keyboard navigation (all features) | ✅ |
| NFR-A11Y-03 | Screen reader support (ARIA) | ✅ |
| NFR-A11Y-04 | Color contrast ratios | ✅ |
| NFR-A11Y-05 | Focus management (modals, drawers) | ✅ |

### 5.6 Browser & Device Support
| Platform | Versions |
|----------|----------|
| Desktop Chrome/Edge/Firefox/Safari | Last 2 major versions |
| Mobile Safari (iOS) | Last 2 major versions |
| Chrome for Android | Last 2 major versions |
| PWA (installable) | ✅ |

---

## 6. Technical Architecture Requirements

### 6.1 Frontend
- **Framework**: React 19 + Next.js 15 (App Router, RSC)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + CSS Variables (design tokens)
- **UI Components**: Custom design system (Radix UI primitives + Tailwind)
- **State**: TanStack Query (server), Zustand (client), React Hook Form + Zod
- **PWA**: next-pwa (Workbox) — installable, offline-first for read operations

### 6.2 Backend
- **Runtime**: Node.js 22+ (TypeScript)
- **Framework**: Hono (fast, lightweight, Edge-compatible) on Cloudflare Workers
- **API**: REST (v1) + GraphQL (for flexible queries) via GraphQL Yoga
- **Auth**: Better Auth (email/password, OAuth, RBAC, sessions)
- **Database ORM**: Drizzle ORM (type-safe, fast, migrations)
- **Validation**: Zod (shared with frontend via packages/shared)

### 6.3 Database
- **Primary**: PostgreSQL 16 (Neon serverless — free tier, auto-scale, branching)
- **Cache**: Redis (Upstash — free tier, serverless)
- **Search**: PostgreSQL full-text search (tsvector) — upgrade to Meilisearch if needed
- **Analytics**: ClickHouse (Tinybird) for OLAP — evaluate later

### 6.4 Infrastructure & DevOps
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Monorepo | Turborepo | Fast builds, caching, task orchestration |
| CI/CD | GitHub Actions | Free for public, mature, OIDC support |
| Preview Deployments | Cloudflare Pages + Workers | Free, instant, global Edge |
| Production | Cloudflare Workers + Neon + Upstash | Serverless, auto-scale, free tiers generous |
| Secrets | GitHub Environments + Cloudflare Workers secrets | Secure, no external vault needed |
| Monitoring | Sentry (free tier) + Cloudflare Analytics | Error tracking + performance |
| Logging | Structured JSON (Pino) → Cloudflare Logs | Queryable, correlated |
| Database Migrations | Drizzle Kit + GitHub Actions | Version-controlled, reviewable |

---

## 7. API Design

### 7.1 REST Conventions
- **Base Path**: `/api/v1`
- **Versioning**: URL path (`/v1/`, `/v2/`)
- **Auth**: `Authorization: Bearer <jwt>`
- **Org Context**: `X-Organization-ID` header (validated against JWT claims)
- **Pagination**: Cursor-based (`?cursor=&limit=50`)
- **Filtering**: `?filter[field]=value&filter[status]=in_stock`
- **Sorting**: `?sort=-created_at,sku`
- **Field Selection**: `?fields=id,name,sku,quantity`
- **Errors**: RFC 9457 (Problem Details)

### 7.2 Core Resources
```
/organizations
/organizations/{id}/members
/organizations/{id}/settings
/warehouses
/categories
/products
/products/{id}/variants
/products/{id}/images
/products/{id}/stock
/products/{id}/movements
/suppliers
/suppliers/{id}/catalog
/purchase-orders
/purchase-orders/{id}/receive
/sales-orders
/sales-orders/{id}/fulfill
/stock-movements
/reports/inventory-valuation
/reports/stock-movement
/reports/low-stock
/reports/supplier-performance
/users/me
/users/me/notifications
/users/me/preferences
```

### 7.3 GraphQL (Supplemental)
- Single endpoint: `/api/graphql`
- Queries for complex dashboards (nested data)
- Mutations mirror REST
- Subscriptions for real-time stock updates (WebSocket over Workers)

---

## 8. Database Schema (High-Level ERD)

```
Organization (1) ─────< (N) User (via Membership)
Organization (1) ─────< (N) Warehouse
Organization (1) ─────< (N) Category (hierarchical)
Organization (1) ─────< (N) Product
Product (1) ─────< (N) ProductVariant
Product (1) ─────< (N) ProductImage
Product (1) ─────< (N) SupplierProduct (catalog)
Supplier (1) ─────< (N) SupplierProduct
Warehouse (1) ─────< (N) StockLevel (ProductVariant × Warehouse)
StockLevel (1) ─────< (N) StockMovement (immutable)
PurchaseOrder (1) ─────< (N) PurchaseOrderLine
PurchaseOrder (1) ─────< (N) PurchaseReceipt
SalesOrder (1) ─────< (N) SalesOrderLine
SalesOrder (1) ─────< (N) Shipment
Customer (1) ─────< (N) SalesOrder
User (1) ─────< (N) Notification
```

**Key Indexes**: Composite on `(org_id, warehouse_id, product_variant_id)` for stock lookups; GIN on product search vectors; BRIN on `stock_movements.created_at` for time-series.

---

## 9. UI/UX Strategy

### 9.1 Design Principles
- **Clarity over density** — generous whitespace, clear hierarchy
- **Mobile-first** — warehouse floor usage on phones/tablets
- **Keyboard-first** — power users never touch mouse
- **Optimistic UI** — instant feedback, background sync
- **Skeleton loading** — perceived performance
- **Empty states** — actionable guidance, not dead ends

### 9.2 Color System
- **Light/Dark modes** — CSS variables, system preference + manual toggle
- **Semantic tokens** — `color-status-success`, `color-status-warning`, `color-status-danger`
- **Data visualization palette** — colorblind-safe (CVD-friendly)

### 9.3 Component Library (packages/ui)
- 40+ primitives: Button, Input, Select, Table, Dialog, Drawer, Toast, Tooltip, Avatar, Badge, Tabs, Sidebar, NavigationMenu, Chart, Calendar, DatePicker, FileUpload, BarcodeScanner, DataGrid (virtualized)
- Storybook documentation
- Visual regression testing (Chromatic)

### 9.4 Key Screens
| Screen | Priority | Notes |
|--------|----------|-------|
| Dashboard | P0 | Widgets: KPI cards, stock alerts, recent activity, charts |
| Product List | P0 | Virtualized table, inline edit, multi-select actions |
| Product Detail | P0 | Tabbed: Info, Variants, Stock, Movements, Suppliers, History |
| Stock Adjustment | P0 | Modal/drawer, barcode scan, reason codes, batch entry |
| Purchase Order List | P0 | Kanban board (status columns) + table view |
| PO Detail / Receive | P0 | Line-by-line receipt, variance handling, quality flags |
| Supplier Scorecard | P1 | Radar chart, trend lines, benchmark |
| Reports Builder | P1 | Drag-drop, saved views, scheduled exports |
| Settings / Org | P1 | Tabbed: General, Warehouses, Categories, Users, Integrations |

---

## 10. Milestones & Phases

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Week 1-2 | PRD, Business Analysis, Pain Points, Feature Inventory (this doc) |
| **Phase 2** | Week 3-4 | SRS, System Architecture, Tech Stack Evaluation, Database Design, API Design, UI/UX Strategy |
| **Phase 3** | Week 5-6 | Design System, Wireframes, Component Architecture, Navigation Flow, User Journey |
| **Phase 4** | Week 7-8 | Repo Init: Monorepo, Tooling, Linting, CI/CD, Auth Scaffold, DB Schema, API Scaffold |
| **Phase 5** | Week 9-20 | Feature Implementation (incremental, reviewed) |
| **Phase 6** | Week 21-22 | Architecture Review, Security Audit, Performance Audit, UX Review, Accessibility Review |

---

## 11. Open Questions / Assumptions

| # | Question | Assumption (if any) |
|---|----------|---------------------|
| 1 | Multi-currency required at launch? | **No** — single currency per org, multi-currency P2 |
| 2 | Lot/serial tracking required at launch? | **No** — P2 |
| 3 | POS / e-commerce integrations at launch? | **No** — API-first, webhooks P1, native integrations P2 |
| 4 | Offline mode for mobile? | **Read-only offline** (cached data), writes queue online — P1 |
| 5 | Self-hosted option? | **No** — SaaS only initially |
| 6 | White-label / embedded? | **No** — P3 |
| 7 | Data migration from legacy? | **CSV import tool** at launch; automated migration service P2 |

---

## 12. Success Metrics (North Star)

| Metric | Target (6 mo) | Target (12 mo) |
|--------|---------------|----------------|
| Active Organizations | 50 | 300 |
| Monthly Active Users | 200 | 1,500 |
| API Requests/day | 100k | 5M |
| Stockout Reduction (self-reported) | 30% | 60% |
| NPS | > 40 | > 55 |
| Churn (monthly) | < 5% | < 3% |

---

**Next Step**: Engineering review → Phase 2 (SRS, Architecture, Tech Stack, Database, API, UI/UX Strategy)