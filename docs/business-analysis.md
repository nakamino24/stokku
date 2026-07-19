# Business Analysis
## Stokku — Inventory Management System Rebuild

**Version:** 2.0  
**Status:** Draft — For Engineering Review  
**Date:** July 2026

---

## 1. Market Context

### 1.1 Total Addressable Market (TAM)
- **Global SMB Inventory Management Software**: $3.2B (2024), growing 11.2% CAGR
- **Target Segment**: 5-500 employee businesses in wholesale, retail, manufacturing, distribution
- **Geographic Focus**: North America, Western Europe, ANZ, Southeast Asia (English-first)

### 1.2 Competitive Landscape

| Competitor | Positioning | Strengths | Weaknesses | Pricing |
|------------|-------------|-----------|------------|---------|
| **Cin7 / DEAR** | Mid-market ERP | Deep features, integrations | Complex, expensive ($300+/mo) | $$$$ |
| **TradeGecko (QuickBooks Commerce)** | QB ecosystem | QB integration | Discontinued/limited | $$$ |
| **inFlow** | SMB desktop-first | Offline, perpetual license | Dated UX, limited cloud | $$ |
| **Sortly** | Asset tracking | Visual, mobile-first | Light on purchasing/analytics | $ |
| **Zoho Inventory** | Zoho suite | Integrated, affordable | Clunky UI, limited API | $ |
| **Fishbowl** | Manufacturing | QuickBooks sync, Mfg features | On-prem focus, steep learning | $$$$ |
| **Odoo Inventory** | Modular ERP | Open source, full suite | Complex setup, performance | $$ |
| **Stocky (Shopify)** | Shopify POS | Native POS integration | Shopify-only | $ |

### 1.3 Our Strategic Positioning
**"Linear for Inventory"** — Opinionated, fast, beautiful, developer-friendly. Not a feature-parity ERP. We win on:
- **DX/API-first**: Best integration story for modern stacks (Shopify, Vercel, Supabase, Stripe)
- **Mobile-first PWA**: Warehouse floor ready, offline-capable
- **Real-time everything**: WebSocket sync, optimistic UI, no refresh
- **Transparent pricing**: Per-seat, usage-based API, no hidden modules
- **Extensibility**: Webhooks, custom fields, GraphQL, React plugin system

---

## 2. Business Model

### 2.1 Revenue Streams
| Stream | Model | Target |
|--------|-------|--------|
| **SaaS Subscriptions** | Per seat/month (tiered) | 85% |
| **API Usage** | Per 10k requests (after free tier) | 10% |
| **Professional Services** | Implementation, migration, custom integrations | 5% |

### 2.2 Pricing Tiers (Proposed)

| Tier | Price/Seat/Mo | Seats Included | API Calls/Mo | Features |
|------|---------------|----------------|--------------|----------|
| **Starter** | $29 | 3 | 50k | Core inventory, 1 location, basic reports, email support |
| **Professional** | $79 | 10 | 500k | Multi-location, purchase orders, supplier scorecards, webhooks, Slack alerts |
| **Business** | $149 | 25 | 2M | Bundles/kits, barcode scanning, advanced analytics, SSO (SAML/OIDC), priority support |
| **Enterprise** | Custom | Unlimited | Unlimited | Dedicated infra, SLA, custom contracts, on-prem option, CSM |

*Free tier: 1 seat, 1 location, 10k API calls, community support — for developers/side projects*

### 2.3 Unit Economics (Target)
- **CAC**: <$500 (content/SEO, partner referrals, marketplace)
- **LTV**: >$3,000 (36-month avg retention)
- **Payback**: <6 months
- **Gross Margin**: >85% (SaaS), >90% (API)

---

## 3. Go-to-Market Strategy

### 3.1 Launch Phases
| Phase | Timeline | Focus | Success Criteria |
|-------|----------|-------|------------------|
| **Alpha** | M1-M3 | Design partners (5-10), dogfood | 5 orgs daily active, <5 critical bugs |
| **Private Beta** | M4-M6 | Waitlist (100), content SEO | 50 paying, NPS >40 |
| **Public Beta** | M7-M9 | Product Hunt, marketplaces, partners | 200 paying, $10k MRR |
| **GA** | M10-M12 | Paid acquisition, channel partners | 500 paying, $50k MRR |

### 3.2 Acquisition Channels (Priority Order)
1. **Developer Content/SEO** — "How to build inventory API", "Supabase + Next.js inventory tutorial"
2. **Marketplace Listings** — Shopify App Store, Vercel Marketplace, Supabase Partners
3. **Integration Partnerships** — Co-market with accounting (Xero, QuickBooks), POS (Square, Toast), e-comm (Shopify, WooCommerce)
4. **Referral Program** — 20% revenue share for first 12 months
5. **Paid** — Google search (high intent), retargeting (later)

### 3.3 Key Partnerships
| Partner | Value | Status |
|---------|-------|--------|
| **Supabase** | Auth, DB, Realtime, Edge Functions | Native integration |
| **Vercel** | Hosting, Edge, Analytics | Native deployment |
| **Stripe** | Billing, Portal, Tax | Native |
| **Resend** | Transactional email | Native |
| **Shopify** | App Store distribution | Apply at Beta |
| **Xero/QuickBooks** | Accounting sync | API integration first |

---

## 4. User Research Insights (From Legacy App Analysis)

### 4.1 What Users Actually Do (vs. What We Built)
| Legacy Feature | Actual Usage | Insight |
|----------------|--------------|---------|
| Dashboard charts | 90% view, 10% act | Make charts actionable (drill-down, one-click PO) |
| Product CRUD | Daily | Must be keyboard-fast, bulk operations |
| Supplier management | Weekly | Needs performance scoring, not just CRUD |
| Purchase orders | Ad-hoc | Needs workflow: draft → sent → received → invoiced |
| Reports | Monthly (accountant) | Scheduled exports > on-demand UI |
| Import/Export | Onboarding + quarterly | Template validation, dry-run preview critical |
| Settings | Rarely | Hide unless admin, sensible defaults |

### 4.2 Unmet Needs (From Support Tickets & Feedback)
1. **"I need to scan barcodes on my phone in the warehouse"** → PWA + camera scanner
2. **"Supplier X is always late — how do I prove it?"** → Supplier scorecards with SLA tracking
3. **"I sold 5 but stock shows 10 — who changed it?"** → Immutable audit log with user attribution
4. **"Can my accountant just get a CSV every Monday?"** → Scheduled report delivery (email, SFTP, webhook)
5. **"We have bundles (gift boxes) — stock should deduct components"** → Bill of Materials / Kits
6. **"Mobile web is unusable on the floor"** → Offline-first PWA, large touch targets

---

## 5. Product Strategy Decisions

### 5.1 What We Build (Core)
- Multi-tenant inventory engine (products, variants, locations, lots/serials)
- Real-time stock mutations with optimistic UI
- Purchase order lifecycle + supplier scorecards
- Role-based access (Admin/Manager/Staff/Viewer)
- REST + GraphQL API with webhooks
- Embedded analytics (dashboard, scheduled reports)
- Mobile PWA (offline, camera scanner, haptic feedback)

### 5.2 What We Defer (Post-GA)
- Manufacturing/Work Orders (BOM explosion, routing)
- Serialized/Lot tracking (FDA/ISO compliance)
- Advanced forecasting (ML demand planning)
- Multi-currency / Multi-entity consolidation
- Native mobile apps (iOS/Android) — PWA first
- White-label / OEM

### 5.3 What We Explicitly Won't Build
- Accounting/GL (integrate with Xero/QBO)
- POS / E-commerce storefront (integrate with Shopify/Square)
- Payroll / HR
- CRM / Sales pipeline
- Shipping label printing (integrate with ShipStation/EasyPost)

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Supabase pricing changes** | Medium | High | Abstract data layer; eval Neon/Turso as backup |
| **Complexity creep (feature requests)** | High | High | Ruthless prioritization; "No" by default; ADR required |
| **Mobile PWA limitations (iOS)** | High | Medium | Graceful degradation; native app later |
| **Competitor copies features** | Medium | Low | Speed of iteration; DX moat; community |
| **SMB churn (seasonal/cash flow)** | High | Medium | Annual plans discount; usage-based pricing; easy pause |
| **Data migration friction** | High | High | Built-in importers; migration service; CSV templates |
| **Security breach** | Low | Critical | SOC2 Type II by GA; bug bounty; pen test |

---

## 7. Success Metrics (North Star + Guardrails)

### 7.1 North Star Metric
**Weekly Active Organizations (WAO)** — Organizations with ≥1 stock mutation or PO action in trailing 7 days

### 7.2 Leading Indicators
| Metric | Target (Month 12) |
|--------|-------------------|
| WAO / Total Orgs | >60% |
| API Calls / Org / Month | >10k (Professional+) |
| PWA Install Rate | >30% of active users |
| Report Schedule Rate | >40% of Business+ orgs |
| Avg Seats / Org | >3 (Professional+) |

### 7.3 Guardrail Metrics
| Metric | Threshold |
|--------|-----------|
| P95 API Latency | <200ms |
| Error Rate | <0.1% |
| Churn (Monthly Logo) | <3% |
| Support Ticket Volume / Org | <2/mo |
| Time to First Value (onboarding) | <15 min |

---

## 8. Organizational Implications

### 8.1 Team Structure (Post-Series A)
```
Product (3)
├── PM (Core Platform)
├── PM (Integrations & API)
└── PM (Growth & Onboarding)

Engineering (8)
├── Platform Lead (Infra, DX, Security)
├── Backend (3) — Core, API, Integrations
├── Frontend (2) — Web, PWA, Design System
├── Full Stack (1) — Billing, Auth, Admin
└── QA/DevOps (1) — CI/CD, Testing, Observability

Design (2)
├── Product Designer (Core)
└── Product Designer (Growth/Marketing)

GTM (3)
├── DevRel / Technical Writer
├── Growth Marketer (SEO, Content)
└── Customer Success / Support
```

### 8.2 Engineering Principles (Non-Negotiable)
1. **TypeScript everywhere** — Shared types package, codegen from OpenAPI/GraphQL
2. **Test pyramid** — Unit (80%), Integration (15%), E2E (5%) — CI blocks on coverage <80%
3. **Observability first** — Structured logs, traces, metrics before feature ships
4. **Security by default** — OWASP Top 10, dependency scanning, secret scanning, pen test annually
5. **Database migrations** — Reversible, tested, zero-downtime (pg-osc or similar)
6. **API versioning** — Header-based (`Accept: application/vnd.stokku.v1+json`), 12-month deprecation
7. **Documentation as code** — OpenAPI spec generates docs, SDKs, types

---

## 9. Financial Projections (12-Month Post-GA)

| Month | Orgs | Paid Orgs | MRR | ARR | Burn | Runway |
|-------|------|-----------|-----|-----|------|--------|
| 1 | 50 | 20 | $1,500 | $18k | $45k | 18 mo |
| 3 | 150 | 60 | $5,000 | $60k | $55k | 16 mo |
| 6 | 400 | 180 | $18,000 | $216k | $75k | 14 mo |
| 9 | 800 | 350 | $38,000 | $456k | $95k | 12 mo |
| 12 | 1,500 | 650 | $72,000 | $864k | $120k | 18 mo (Series A) |

*Assumes $120/paid org/mo blended, 3.5% monthly churn, 15% expansion revenue*

---

## 10. Appendix: Legacy App Feature Gap Analysis

| Legacy Feature | Rebuild Decision | Rationale |
|----------------|------------------|-----------|
| Sample data mode | **Remove** | Dev-only; replace with seeded demo org |
| Dual Supabase/Sample data paths | **Remove** | Single source of truth; feature flags for dev |
| LocalStorage stock movements | **Remove** | All data in DB; audit log replaces |
| Categories Debug component | **Remove** | Dev tool; replace with admin observability |
| Sales targets (localStorage) | **Rebuild properly** | Move to DB with API, multi-org |
| Static landing page (v0.dev) | **Rebuild** | Marketing site separate from app |
| Radix UI + Tailwind | **Keep philosophy** | Build our own design system on primitives |

---

*End of Business Analysis*