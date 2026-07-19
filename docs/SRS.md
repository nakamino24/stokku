# Software Requirements Specification (SRS)
## Stokku — Inventory Management Platform v2.0

**Version:** 2.0.0-draft  
**Status:** Engineering Review  
**Classification:** Internal — Engineering Team  
**Date:** July 2026

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete functional and non-functional requirements for the Stokku v2.0 rebuild. It serves as the single source of truth for architecture, design, implementation, and verification.

### 1.2 Scope
Stokku is a multi-tenant SaaS inventory management platform for SMBs (5-500 employees) in wholesale, retail, manufacturing, and distribution. Core capabilities: real-time stock tracking, purchase order lifecycle, supplier performance, embedded analytics, and developer-first API.

### 1.3 Definitions & Acronyms
| Term | Definition |
|------|------------|
| **Org** | Organization — top-level tenant boundary |
| **SKU** | Stock Keeping Unit — unique product variant identifier |
| **PO** | Purchase Order |
| **SO** | Sales Order |
| **UoM** | Unit of Measure |
| **FEFO** | First Expired, First Out |
| **BOM** | Bill of Materials (kits/bundles) |
| **RLS** | Row Level Security |
| **PWA** | Progressive Web App |
| **RSC** | React Server Components |

### 1.4 References
- PRD v2.0 (`docs/PRD.md`)
- Business Analysis (`docs/business-analysis.md`)
- Pain Points (`docs/pain-points.md`)
- Feature Inventory (`docs/feature-inventory.md`)
- OWASP ASVS 4.0, WCAG 2.1 AA, RFC 9457

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization (AUTH)

#### 2.1.1 User Registration & Login
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| AUTH-01 | Email/password registration with Argon2id hashing | P0 | FR-AUTH-01 |
| AUTH-02 | Email verification via signed JWT link (24h expiry) | P0 | FR-AUTH-01 |
| AUTH-03 | Google OAuth 2.0 / OIDC login | P0 | FR-AUTH-02 |
| AUTH-04 | Password reset via secure token (1h expiry, single-use) | P0 | FR-AUTH-04 |
| AUTH-05 | Session: JWT access (15m) + refresh token (30d, rotation) | P0 | FR-AUTH-03 |

#### 2.1.2 Multi-Factor Authentication
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| AUTH-06 | TOTP (RFC 6238) with QR setup, backup codes (10) | P1 | FR-AUTH-08 |
| AUTH-07 | WebAuthn (passkeys) for passwordless login | P2 | FR-AUTH-08 |

#### 2.1.3 Organization & RBAC
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| AUTH-08 | Create organization on first signup (owner = Admin) | P0 | FR-AUTH-06 |
| AUTH-09 | Invite members via email with role (Admin, Manager, Staff, Viewer) | P0 | FR-AUTH-05 |
| AUTH-10 | Role permissions matrix (see §2.1.4) enforced at API + UI | P0 | FR-AUTH-05 |
| AUTH-11 | Switch organization context (header selector) | P1 | FR-ORG-02 |
| AUTH-12 | Session device management (list, revoke) | P1 | FR-AUTH-09 |

#### 2.1.4 Role Permission Matrix
| Capability | Admin | Manager | Staff | Viewer |
|------------|-------|---------|-------|--------|
| Org settings, billing, members | ✅ | ❌ | ❌ | ❌ |
| Warehouse/location CRUD | ✅ | ✅ | ❌ | ❌ |
| Product/category CRUD | ✅ | ✅ | ❌ | ❌ |
| Stock adjustments | ✅ | ✅ | ✅ | ❌ |
| PO create/send/receive | ✅ | ✅ | ✅ | ❌ |
| PO approve (spend limit) | ✅ | ✅ | ❌ | ❌ |
| Supplier CRUD | ✅ | ✅ | ❌ | ❌ |
| Sales orders | ✅ | ✅ | ✅ | ❌ |
| Reports view | ✅ | ✅ | ✅ | ✅ |
| Reports schedule/export | ✅ | ✅ | ❌ | ❌ |
| API keys manage | ✅ | ❌ | ❌ | ❌ |
| Audit log view | ✅ | ✅ | ❌ | ❌ |

### 2.2 Organization & Tenancy (ORG)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| ORG-01 | Organization profile: name, logo, timezone, locale, currency, date format | P0 | FR-ORG-03 |
| ORG-02 | Branding: primary color, logo (light/dark), favicon | P1 | FR-ORG-03 |
| ORG-03 | Subscription tier enforcement (seat limits, API quota, features) | P0 | Business |
| ORG-04 | Usage metrics API (seats, API calls, storage) | P1 | Business |

### 2.3 Warehouse & Location Management (WHS)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| WHS-01 | Hierarchical locations: Warehouse → Zone → Aisle → Rack → Bin | P0 | FR-SET-01 |
| WHS-02 | Location types: storage, staging, quarantine, shipping, receiving | P1 | FR-SET-01 |
| WHS-03 | Capacity tracking (volume, weight, pallet count) | P2 | FR-SET-01 |
| WHS-04 | Default location per product variant | P1 | FR-INV-01 |

### 2.4 Product Catalog (CAT)

#### 2.4.1 Categories
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| CAT-01 | Hierarchical categories (unlimited depth, materialized path) | P0 | FR-SET-02 |
| CAT-02 | Category metadata: description, image, custom fields | P1 | FR-PROD-05 |

#### 2.4.2 Products & Variants
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| CAT-03 | Product: name, description, base UoM, category, brand, tags | P0 | FR-PROD-01 |
| CAT-04 | Variants: option dimensions (size, color, style) → unique SKU | P0 | FR-PROD-02 |
| CAT-05 | SKU format validation (regex per org, auto-generate option) | P1 | FR-PROD-01 |
| CAT-06 | Barcode: EAN-13, UPC-A, Code128, QR — generate, print, scan | P1 | FR-PROD-04 |
| CAT-07 | Images: multiple, drag-reorder, primary, alt text, CDN delivery | P1 | FR-PROD-03 |
| CAT-08 | Pricing: base price, cost, price lists (tiered by qty/customer) | P1 | FR-SO-05 |
| CAT-09 | Inventory policy: reorder point, reorder qty, max stock, lead time | P0 | FR-INV-04 |
| CAT-10 | Tracking mode: none / lot / serial / FEFO (per variant) | P2 | FR-INV-08,09 |
| CAT-11 | Bundles/BOM: components with quantities, auto-explode on SO/PO | P2 | FR-PROD-06 |
| CAT-12 | Custom fields (key-value, typed: text, number, date, select) | P2 | FR-PROD-05 |
| CAT-13 | Archive/restore (soft delete) with dependency checks | P1 | FR-PROD-07 |
| CAT-14 | Bulk import/export: CSV/Excel with validation preview, dry-run | P1 | FR-PROD-08 |

#### 2.4.3 Supplier Catalog
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| CAT-15 | Supplier product: supplier SKU, lead time, MOQ, price breaks, currency | P0 | FR-SUP-02 |
| CAT-16 | Preferred/alternate supplier per variant | P1 | FR-SUP-04 |

### 2.5 Inventory Tracking (INV)

#### 2.5.1 Stock Levels
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| INV-01 | Real-time stock per variant × location (on-hand, allocated, available) | P0 | FR-INV-01 |
| INV-02 | Stock status computed: In Stock / Low Stock / Out of Stock / On Order | P0 | FR-INV-03 |
| INV-03 | Allocation: soft (SO confirmed) + hard (picked) reservations | P1 | FR-INV-05 |
| INV-04 | Negative stock prevention (configurable per org) | P1 | FR-INV-01 |

#### 2.5.2 Stock Movements (Immutable Ledger)
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| INV-05 | Movement types: receipt, shipment, adjustment+, adjustment-, transfer-out, transfer-in, count, reserve, release, scrap | P0 | FR-INV-02 |
| INV-06 | Each movement: variant, location, qty, UoM, reason code, reference (PO/SO/transfer), user, timestamp | P0 | FR-INV-10 |
| INV-07 | Lot/serial tracking on movements (when enabled per variant) | P2 | FR-INV-08 |
| INV-08 | FEFO enforcement on outbound (oldest expiry first) | P2 | FR-INV-09 |
| INV-09 | Transfer workflow: request → pick → ship → in-transit → receive | P1 | FR-INV-06 |
| INV-10 | Cycle count: generate count sheets, enter counts, variance approval | P1 | FR-INV-07 |

#### 2.5.3 Valuation
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| INV-11 | Valuation methods: FIFO, Weighted Average Cost (configurable per org) | P1 | FR-RPT-02 |
| INV-12 | Real-time inventory valuation report | P1 | FR-RPT-02 |

### 2.6 Procurement (PRC)

#### 2.6.1 Suppliers
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| PRC-01 | Supplier: name, contacts, addresses, payment terms, tax ID, currency | P0 | FR-SUP-01 |
| PRC-02 | Supplier performance scorecard: on-time %, defect rate, fill rate, lead time variance | P1 | FR-SUP-03 |
| PRC-03 | Supplier portal: view POs, confirm receipt dates, upload ASN/invoice | P2 | FR-SUP-05 |

#### 2.6.2 Purchase Orders
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| PRC-04 | PO status: Draft → Sent → Confirmed → Partial/Full Received → Invoiced → Closed | P0 | FR-PO-02 |
| PRC-05 | Create PO: manual, from reorder suggestions, from SO backorders | P0 | FR-PO-01 |
| PRC-06 | PO line: variant, qty, unit price, discount, tax, expected date, location | P0 | FR-PO-02 |
| PRC-07 | Email PO (PDF) with template; track open/click | P1 | FR-PO-03 |
| PRC-08 | Receive against PO: scan/enter qty per line, variance flags, quality hold | P0 | FR-PO-04 |
| PRC-09 | Partial receipts → backorder line; auto-create follow-up PO | P1 | FR-PO-02 |
| PRC-10 | Three-way match: PO ↔ Receipt ↔ Invoice (flag variances) | P2 | FR-PO-05 |
| PRC-11 | Blanket/recurring PO with release schedules | P2 | FR-PO-07 |
| PRC-12 | PO approval workflow (spend limits per role) | P1 | RBAC |

### 2.7 Sales & Orders (SAL)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| SAL-01 | Customer: name, contacts, addresses, payment terms, credit limit, tax exempt | P1 | FR-SO-04 |
| SAL-02 | Price lists: per customer/group, tiered by qty, validity dates | P2 | FR-SO-05 |
| SAL-03 | Sales Order: Draft → Confirmed → Allocated → Picked → Packed → Shipped → Invoiced | P1 | FR-SO-01 |
| SAL-04 | Stock allocation on confirm (soft reserve) | P1 | FR-SO-02 |
| SAL-05 | Pick/Pack/Ship workflow with mobile scanning | P1 | FR-SO-03 |
| SAL-06 | Shipment tracking number, carrier, label generation (integration) | P2 | FR-SO-03 |
| SAL-07 | Backorder management: split shipment, partial invoice | P1 | FR-SO-01 |
| SAL-08 | Quick sale (walk-in, no customer) — POS mode | P2 | FR-SO-01 |

### 2.8 Reporting & Analytics (RPT)

#### 2.8.1 Real-time Dashboard
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| RPT-01 | KPI cards: stock value, turns, days of supply, stockout rate, fill rate | P0 | FR-RPT-01 |
| RPT-02 | Charts: stock trend, movement heatmap, ABC analysis, supplier OTIF | P0 | FR-RPT-01 |
| RPT-03 | Alerts panel: low stock, overdue PO, overdue receipt, negative stock | P0 | FR-RPT-01 |

#### 2.8.2 Standard Reports
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| RPT-04 | Stock movement report (filters: date, variant, location, type, user) | P0 | FR-RPT-03 |
| RPT-05 | Low stock / reorder report with suggested PO quantities | P0 | FR-RPT-04 |
| RPT-06 | Inventory valuation (FIFO/WAC) with GL account mapping | P1 | FR-RPT-02 |
| RPT-07 | Supplier performance (scorecard, trend, benchmark) | P1 | FR-RPT-05 |
| RPT-08 | Sales velocity & demand forecast (SMA, exponential smoothing) | P2 | FR-RPT-06 |
| RPT-09 | Aging report (stock by receipt date, expiry date) | P1 | FR-RPT-05 |

#### 2.8.3 Report Delivery
| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| RPT-10 | Schedule: daily/weekly/monthly, timezone-aware, multiple recipients | P1 | FR-RPT-07 |
| RPT-11 | Export formats: CSV, Excel (formatted), PDF, JSON | P1 | FR-RPT-08 |
| RPT-12 | Delivery: email attachment, webhook, SFTP, S3 presigned URL | P2 | FR-RPT-07 |
| RPT-13 | Custom report builder: drag-drop, filters, groupings, formulas | P2 | FR-RPT-09 |

### 2.9 Notifications & Alerts (NOT)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| NOT-01 | In-app notification center (bell icon) with real-time WebSocket | P1 | FR-NOT-01 |
| NOT-02 | Email notifications: templated, preference-driven, unsubscribe link | P1 | FR-NOT-02 |
| NOT-03 | Push notifications (PWA) for mobile: low stock, PO status | P2 | FR-NOT-03 |
| NOT-04 | Slack / MS Teams webhook integration | P2 | FR-NOT-04 |
| NOT-05 | Alert rules: threshold, frequency, escalation, acknowledgment | P1 | FR-NOT-05 |
| NOT-06 | Digest emails (daily/weekly summary) | P1 | FR-NOT-02 |

### 2.10 Settings & Configuration (CFG)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| CFG-01 | Units of Measure: base + conversions (e.g., case=24 each) | P1 | FR-SET-03 |
| CFG-02 | Tax rates & groups (compound, inclusive/exclusive) | P2 | FR-SET-04 |
| CFG-03 | Numbering sequences: PO, SO, Transfer, Adjustment, Receipt | P1 | FR-SET-06 |
| CFG-04 | Reason codes for adjustments (required, categorized) | P1 | FR-INV-02 |
| CFG-05 | Document templates (PO, SO, Pick List, Packing Slip) | P2 | FR-PO-03 |
| CFG-06 | Integration settings: webhook endpoints, API keys, OAuth clients | P1 | API |

### 2.11 Audit & Compliance (AUD)

| ID | Requirement | Priority | Traceability |
|----|-------------|----------|--------------|
| AUD-01 | Immutable audit log: all CRUD on core entities + auth events | P0 | NFR-SEC-07 |
| AUD-02 | Tamper-evident: hash chain + periodic anchoring (Merkle) | P1 | NFR-SEC-07 |
| AUD-03 | GDPR: data export (JSON), right to erasure (anonymize) | P1 | NFR-SEC-05 |
| AUD-04 | SOC 2 readiness: access logs, change control, encryption proof | P1 | NFR-SEC-04 |

---

## 3. Non-Functional Requirements

### 3.1 Performance
| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| NFR-PERF-01 | Dashboard load (p95) | < 1.5s | Lighthouse CI |
| NFR-PERF-02 | Product list (10k, paginated 50) | < 500ms | k6 load test |
| NFR-PERF-03 | Stock adjustment write (p95) | < 200ms | k6 load test |
| NFR-PERF-04 | API read (p95) | < 300ms | Cloudflare Analytics |
| NFR-PERF-05 | API write (p95) | < 500ms | Cloudflare Analytics |
| NFR-PERF-06 | WebSocket message broadcast | < 100ms | Custom monitor |
| NFR-PERF-07 | PWA install size (gzipped) | < 500KB JS | Bundle analyzer |
| NFR-PERF-08 | Time to Interactive (mobile 4G) | < 3.5s | WebPageTest |

### 3.2 Scalability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-01 | Organizations per cluster | 10,000+ |
| NFR-SCALE-02 | Products per organization | 100,000+ |
| NFR-SCALE-03 | Concurrent users per organization | 500+ |
| NFR-SCALE-04 | Stock movements per day per org | 100,000+ |
| NFR-SCALE-05 | Horizontal scaling (stateless workers, read replicas) | Required |

### 3.3 Reliability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | Uptime SLA | 99.9% (monthly) |
| NFR-REL-02 | RPO (point-in-time recovery) | < 1 hour |
| NFR-REL-03 | RTO (disaster recovery) | < 4 hours |
| NFR-REL-04 | Automated daily + PITR backups | Required |
| NFR-REL-05 | Multi-AZ deployment (primary + standby) | P1 |

### 3.4 Security
| ID | Requirement | Standard |
|----|-------------|----------|
| NFR-SEC-01 | Encryption at rest (AES-256) | Database default |
| NFR-SEC-02 | Encryption in transit (TLS 1.3) | Enforced |
| NFR-SEC-03 | OWASP Top 10 compliance | ASVS Level 2 |
| NFR-SEC-04 | SOC 2 Type II readiness | By GA |
| NFR-SEC-05 | GDPR compliance (export, deletion) | Required |
| NFR-SEC-06 | Rate limiting: 1000 req/min/user, 100 auth/min/IP | Required |
| NFR-SEC-07 | Audit logging (immutable, queryable) | Required |
| NFR-SEC-08 | CSP, HSTS, X-Frame-Options, Referrer-Policy | Required |
| NFR-SEC-09 | Dependency scanning (SAST/SCA) in CI | Required |
| NFR-SEC-10 | Penetration test (annual) | Required |

### 3.5 Accessibility
| ID | Requirement | Standard |
|----|-------------|----------|
| NFR-A11Y-01 | WCAG 2.1 AA compliance | Required |
| NFR-A11Y-02 | Keyboard navigation (all features) | Required |
| NFR-A11Y-03 | Screen reader support (ARIA, live regions) | Required |
| NFR-A11Y-04 | Color contrast (4.5:1 text, 3:1 UI) | Required |
| NFR-A11Y-05 | Focus management (modals, drawers, toasts) | Required |
| NFR-A11Y-06 | Reduced motion preference | Required |
| NFR-A11Y-07 | Skip links, landmark regions | Required |

### 3.6 Browser & Device Support
| Platform | Versions |
|----------|----------|
| Chrome/Edge (Desktop) | Last 2 major |
| Firefox (Desktop) | Last 2 major |
| Safari (Desktop) | Last 2 major |
| Safari (iOS) | Last 2 major |
| Chrome (Android) | Last 2 major |
| PWA (installable) | Required |

---

## 4. System Interfaces

### 4.1 External APIs (Outbound)
| Integration | Purpose | Auth | Protocol |
|-------------|---------|------|----------|
| Supabase Auth | User management, OAuth | Service key | REST |
| Neon PostgreSQL | Primary database | Connection pool | TCP/TLS |
| Upstash Redis | Caching, rate limits, sessions | Token | HTTP/Redis |
| Resend | Transactional email | API key | REST |
| Stripe | Billing, subscriptions, portal | Secret key | REST + Webhooks |
| Sentry | Error tracking, performance | DSN | HTTP |
| Cloudflare R2 | File storage (images, exports) | S3-compatible | S3 API |
| Meilisearch (optional) | Full-text search | API key | REST |

### 4.2 Webhooks (Outbound)
| Event | Payload | Retry Policy |
|-------|---------|--------------|
| `stock.adjusted` | variant_id, location_id, qty_delta, movement_type, user_id | 3x exponential backoff |
| `po.created` / `po.received` | PO object with lines | 3x |
| `so.created` / `so.shipped` | SO object with lines | 3x |
| `product.low_stock` | variant_id, current_qty, reorder_point | 1x (deduped) |
| `supplier.scorecard_updated` | supplier_id, metrics | 1x |

### 4.3 Import/Export Formats
| Format | Use Case | Schema |
|--------|----------|--------|
| CSV (RFC 4180) | Bulk product import/export, stock take | Defined per template |
| Excel (.xlsx) | Formatted reports, multi-sheet imports | OpenXML |
| JSON | API sync, webhook payloads | OpenAPI components |
| PDF | PO, SO, packing slip, labels | Template-based |

---

## 5. Data Requirements

### 5.1 Data Retention
| Data Type | Retention | Disposition |
|-----------|-----------|-------------|
| Stock movements (ledger) | 7 years (configurable) | Archive to cold storage |
| Audit logs | 7 years | Immutable, never delete |
| POs / SOs / Invoices | 7 years | Archive |
| Session/refresh tokens | 30 days | Auto-expire |
| Notification history | 90 days | Purge |
| Exported reports | 30 days | Auto-delete |

### 5.2 Data Residency
- Primary: US-East (Neon default)
- EU option: Frankfurt (Neon EU) — P1
- No cross-region replication without explicit consent

### 5.3 PII Handling
| Field | Classification | Encryption |
|-------|----------------|------------|
| User email, name | PII | At rest + transit |
| Customer contact info | PII | At rest + transit |
| Supplier contact info | Business | At rest + transit |
| API keys | Secret | Hashed (bcrypt) + prefix |

---

## 6. Operational Requirements

### 6.1 Deployment
| Requirement | Specification |
|-------------|---------------|
| Environments | Development (per PR), Staging, Production |
| Preview Deployments | Every PR → unique URL (Cloudflare Pages) |
| Production Deploy | Merge to main → auto-deploy (GitHub Actions) |
| Rollback | One-click (previous Docker image / Worker version) |
| Blue/Green | Cloudflare Workers instant rollback |

### 6.2 Monitoring & Alerting
| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| Error rate | Sentry | > 1% / 5min |
| API latency p95 | Cloudflare / Custom | > 500ms / 5min |
| DB CPU / connections | Neon dashboard | > 80% / 15min |
| Queue depth (webhooks) | Custom | > 1000 / 5min |
| Certificate expiry | SSL Labs / CF | < 30 days |
| Backup success | Neon / Custom | Daily verification |

### 6.3 Logging
- Structured JSON (Pino) → Cloudflare Logs / Loki
- Fields: timestamp, level, trace_id, span_id, user_id, org_id, action, resource, duration_ms, error
- PII redacted automatically

### 6.4 Capacity Planning
- Neon: Auto-scaling (0-100 CU), storage auto-grow
- Upstash Redis: Pay-per-request, 256MB free tier → scale
- Cloudflare Workers: Unlimited requests on paid plan

---

## 7. Verification & Validation

### 7.1 Test Strategy
| Level | Tool | Coverage Target | Gates |
|-------|------|-----------------|-------|
| Unit | Vitest | 80% lines, 70% branches | CI fail < 80% |
| Integration | Vitest + Testcontainers | Critical paths | CI required |
| E2E | Playwright | Core user journeys | CI required |
| Visual | Storybook + Chromatic | Design system components | PR check |
| Contract | Pact / Schemathesis | API consumer contracts | CI required |
| Load | k6 | NFR-PERF targets | Pre-release |
| Security | Trivy, npm audit, CodeQL | 0 critical/high | CI gate |

### 7.2 Definition of Done (per feature)
- [ ] Implementation complete
- [ ] Unit tests (≥80% coverage on new code)
- [ ] Integration tests for API endpoints
- [ ] E2E test for happy path + 1 error path
- [ ] Storybook stories for new UI components
- [ ] API documentation updated (OpenAPI)
- [ ] Database migration reviewed + tested
- [ ] Security review (OWASP checklist)
- [ ] Performance budget met
- [ ] Accessibility audit (axe-core in CI)
- [ ] Code review approved (2 reviewers)
- [ ] Deployed to preview, verified by PM

---

## 8. Future Extensibility (Non-Current)

| Area | Planned | Rationale |
|------|---------|-----------|
| Manufacturing / Work Orders | P2 | BOM explosion, routing, costing |
| Multi-currency / Multi-entity | P2 | Global customers |
| Advanced Forecasting (ML) | P3 | Demand planning |
| Native iOS/Android Apps | P3 | Offline-first warehouse |
| Marketplace / App Store | P3 | Partner extensions |
| EDI (AS2, X12) | P3 | Enterprise retail |

---

## 9. Appendices

### 9.1 Glossary
See §1.3

### 9.2 Requirement Traceability Matrix
Full matrix maintained in `docs/traceability.csv` linking: PRD FR → SRS → Test Cases → ADR

### 9.3 Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0.0-draft | 2026-07-19 | Engineering Team | Initial v2.0 SRS |

---

*End of SRS*