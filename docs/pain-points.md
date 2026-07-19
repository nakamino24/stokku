# Pain Points Analysis
## Stokku Legacy Application — Critical Issues Requiring Resolution in Rebuild

**Version:** 2.0  
**Status:** Draft — For Engineering Review  
**Source:** Code audit, architecture review, UX heuristic evaluation

---

## 1. Architecture & Technical Debt

### 1.1 Monolithic Frontend (Next.js Pages Router → App Router Migration Incomplete)
| Issue | Impact | Evidence |
|-------|--------|----------|
| Mixed routing patterns | Confusion, inconsistent data fetching | `app/` uses Server Components but `dashboard-client.tsx` is `'use client'` with client-side data fetching |
| No API layer | Business logic in components | `DataService` called directly from React components; no backend separation |
| Dual data paths (Supabase + Sample) | Complexity, bugs | `USE_SUPABASE` flag throughout; `DataService` has dual implementations |
| LocalStorage for critical data | Data loss, no audit | Sales targets, stock movements stored in `localStorage` |

### 1.2 No Backend / API Layer
| Issue | Impact | Evidence |
|-------|--------|----------|
| Direct Supabase client calls from frontend | Security (RLS bypass risk), no rate limiting, no validation | `SupabaseService` called from `DataService` in browser |
| No request validation | Data integrity issues | Zod schemas only in frontend forms |
| No authentication middleware | Auth logic duplicated | `useAuthGuard` hook, manual checks in every page |
| No observability | Debugging production issues impossible | No structured logging, no traces, no metrics |

### 1.3 Database Design Flaws
| Issue | Impact | Evidence |
|-------|--------|----------|
| `products.supplier` TEXT (legacy) + `supplier_id` FK | Data inconsistency | Schema line 49: `supplier TEXT, -- Keep for backward compatibility` |
| `suppliers.categories` TEXT[] | Not normalized, can't query efficiently | Array of category names, no FK to categories table |
| No `warehouses` / `locations` table | Single-location only | All stock assumes one warehouse |
| No `product_variants` | Can't model size/color variants | Single SKU per product |
| No `stock_movements` as immutable ledger | No audit trail | `transactions` table mutable, no user attribution on adjustments |
| RLS policies too permissive | Security risk | `authenticated` role can read everything; no org isolation |

### 1.4 State Management Chaos
| Issue | Impact | Evidence |
|-------|--------|----------|
| Prop drilling 5+ levels | Refactoring risk, performance | `DashboardClient` → `InventoryContent` → `ProductsTable` |
| Mixed server/client state | Hydration errors, stale data | `DataService` cache + React state + Supabase realtime (not used) |
| No optimistic updates | Perceived latency | Every mutation waits for server response |
| No request deduplication | Double submissions | No TanStack Query / SWR |

---

## 2. User Experience & Design

### 2.1 Visual Design Inconsistencies
| Issue | Impact | Evidence |
|-------|--------|----------|
| No design system | Inconsistent spacing, colors, radii | 40+ Radix components used raw; no wrapper components |
| Hardcoded colors | Dark mode broken | `bg-blue-600`, `text-yellow-300` throughout; CSS variables unused |
| Inconsistent icon sizes | Visual noise | `h-4 w-4`, `h-5 w-5`, `h-8 w-8` mixed |
| No loading/skeleton states | Perceived slowness | Only spinner: `<div className="animate-spin...">` |

### 2.2 Mobile Experience Broken
| Issue | Impact | Evidence |
|-------|--------|----------|
| Sidebar-only navigation | Unusable on mobile | `InventorySidebar` always visible; no bottom nav / drawer pattern |
| Table horizontal scroll | Data hidden | `ProductsTable` no column hiding / priority |
| Touch targets too small | Fat finger errors | Buttons `h-8`, `h-10` — minimum 44px (h-11) |
| No PWA manifest | Can't install | No `manifest.json`, no service worker |

### 2.3 Accessibility Failures
| Issue | WCAG Criterion | Evidence |
|-------|----------------|----------|
| No focus management in modals | 2.4.3 Focus Order | `Dialog` components don't trap focus |
| Missing ARIA labels | 4.1.2 Name, Role, Value | Icon-only buttons: `<Button><MoreHorizontal /></Button>` |
| Color-only status indication | 1.4.1 Use of Color | Badge variants use only color (green/yellow/red) |
| No skip links | 2.4.1 Bypass Blocks | Keyboard users tab through entire sidebar |
| Form inputs not associated | 1.3.1 Info & Relationships | Some `Label` without `htmlFor` matching `Input.id` |

### 2.4 Workflow Inefficiencies
| Workflow | Current Pain | Rebuild Opportunity |
|----------|--------------|---------------------|
| Stock adjustment | 5 clicks, modal, no barcode | Scan → Quantity → Reason → Done (1 screen) |
| Create PO | Manual entry, no suggestions | Auto-generate from reorder points |
| Receive PO | Line-by-line, no variance handling | Scan receipt, auto-match, flag variances |
| Find product | Separate page, no keyboard shortcut | Cmd+K global search, inline results |
| Bulk import | No validation preview, all-or-nothing | Dry-run, row-level errors, partial commit |
| Reports | Static placeholders | Real-time, scheduled, exportable |

---

## 3. Feature Gaps (vs. Market Expectations)

### 3.1 Missing Core Inventory Features
| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Multi-location/warehouse | Can't scale beyond single site | P0 |
| Product variants (size/color) | Apparel, electronics unusable | P0 |
| Lot/serial tracking | Compliance, recall, warranty | P1 |
| Expiry/FEFO management | Perishables waste | P1 |
| Stock reservations / allocations | Overselling, broken promises | P0 |
| Inter-warehouse transfers | Multi-location operations | P1 |
| Cycle count workflow | Audit compliance | P1 |

### 3.2 Missing Procurement Features
| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Supplier scorecards | Can't negotiate, manage risk | P0 |
| Blanket/recurring POs | Manual reordering waste | P1 |
| Three-way matching (PO/Receipt/Invoice) | AP errors, overpayment | P2 |
| Supplier portal | Email/phone ping-pong | P2 |

### 3.3 Missing Sales/Order Features
| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Sales orders with reservations | Stockouts on confirmed orders | P1 |
| Customer management (B2B terms) | No credit control | P1 |
| Price lists / tiered pricing | Manual price overrides | P2 |
| POS / e-commerce integrations | Double entry, sync errors | P1 |

### 3.4 Missing Analytics & Reporting
| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Inventory valuation (FIFO/WAC) | Financial reporting impossible | P0 |
| Demand forecasting | Over/under ordering | P2 |
| Custom report builder | Accountant dependency | P1 |
| Scheduled report delivery | Manual Monday morning work | P1 |
| Real-time dashboard widgets | Reactive management | P0 |

### 3.5 Missing Platform Features
| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| REST/GraphQL API | No integrations, no extensibility | P0 |
| Webhooks | Real-time sync impossible | P0 |
| Multi-tenancy (organizations) | Can't sell to multiple companies | P0 |
| RBAC (4+ roles) | Security, compliance | P0 |
| Audit log (immutable) | Compliance, debugging | P0 |
| SSO (SAML/OIDC) | Enterprise requirement | P1 |
| Custom fields / metadata | Vertical-specific needs | P2 |

---

## 4. Code Quality & Maintainability

### 4.1 TypeScript Issues
| Issue | Count | Example |
|-------|-------|---------|
| `any` type usage | 23+ | `products: any[]` in `DashboardOverviewProps` |
| Missing return types | 15+ | Event handlers, async functions |
| Interface vs type inconsistency | Throughout | `interface Product` + `type ProductFormData` |
| No strict null checks | Implicit | `product.category?.name \|\| 'N/A'` |

### 4.2 Testing Vacuum
| Test Type | Coverage | Evidence |
|-----------|----------|----------|
| Unit | 0% | No `__tests__`, no `*.test.ts`, no Vitest/Jest config |
| Integration | 0% | No API tests, no DB tests |
| E2E | 0% | No Playwright/Cypress config |
| Visual Regression | 0% | No Storybook, no Chromatic |

### 4.3 Linting & Formatting Gaps
| Tool | Status | Issues |
|------|--------|--------|
| ESLint | Basic config | No `plugin:@typescript-eslint/recommended-type-checked`, no `react-hooks/exhaustive-deps` |
| Prettier | Config only | No `prettier-plugin-tailwindcss`, no `prettier-plugin-organize-imports` |
| Husky | Missing | No pre-commit hooks |
| Commitlint | Missing | Non-conventional commits |
| TypeScript | `strict: false` | `tsconfig.json` has `"strict": false` |

### 4.4 Dependency Risks
| Package | Version | Risk |
|---------|---------|------|
| `@radix-ui/*` | `"latest"` | Unpinned, breaking changes possible |
| `next` | `15.2.4` | OK (pinned) |
| `react` | `^19` | Major version, potential breaking changes |
| `zod` | `3.25.67` | OK |
| `sonner` | `"latest"` | Unpinned |

---

## 5. Security Vulnerabilities

### 5.1 Authentication & Authorization
| Vulnerability | Severity | Evidence |
|---------------|----------|----------|
| No password strength enforcement | Medium | `password.length < 6` only check |
| No rate limiting on auth endpoints | High | Supabase Auth defaults only |
| Session fixation possible | Medium | No token rotation on privilege change |
| No MFA/2FA | High | Only email/password + OAuth |
| Password reset token not single-use | Medium | Supabase default, not verified |

### 5.2 Data Protection
| Vulnerability | Severity | Evidence |
|---------------|----------|----------|
| No encryption at rest (beyond Supabase default) | Low | Supabase manages, but no app-level |
| PII in localStorage (email, name) | Medium | `SettingsPage` writes to localStorage |
| No CSP headers | Medium | `next.config.js` missing |
| No security headers (HSTS, X-Frame-Options) | Medium | Not configured |

### 5.3 Injection Risks
| Vulnerability | Severity | Evidence |
|---------------|----------|----------|
| Dynamic SQL in Supabase RPC | Low | Not used, but `DataService` passes raw filters |
| XSS via dangerouslySetInnerHTML | None found | Good — no usage detected |
| CSV injection on export | Medium | `xlsx`/`papaparse` without sanitization |

---

## 6. Performance Bottlenecks

### 6.1 Frontend
| Bottleneck | Impact | Evidence |
|------------|--------|----------|
| No code splitting (all UI components bundled) | Large initial JS | All 40+ Radix components in main bundle |
| No virtualization on product table | 100+ rows = jank | `ProductsTable` renders all rows |
| Images unoptimized | Slow loads | `next/image` not used; placeholder SVGs |
| No caching strategy | Refetch on nav | `DataService` no cache; TanStack Query not used |

### 6.2 Database
| Bottleneck | Impact | Evidence |
|------------|--------|----------|
| No composite indexes for common queries | Slow filters | Only single-column indexes in schema |
| `suppliers.categories` TEXT[] unindexed | Can't filter by category | GIN index needed |
| No partitioning on `stock_movements` | Will degrade at scale | Time-series table, grows unbounded |
| N+1 queries in components | Latency | `ProductsTable` accesses `product.category.name` |

### 6.3 Network
| Bottleneck | Impact | Evidence |
|------------|--------|----------|
| Waterfall requests | Slow page loads | Dashboard → Products → Categories → Suppliers sequential |
| No GraphQL / batch API | Over-fetching | REST would need multiple round trips |
| No CDN for static assets | Global latency | Vercel provides but not configured |

---

## 7. Operational Blind Spots

### 7.1 Observability
| Missing | Consequence |
|---------|-------------|
| Structured logging | Can't query logs; debug by `console.log` |
| Distributed tracing | Can't trace request across services |
| Error tracking (Sentry) | Errors invisible until user reports |
| Business metrics | No dashboards for signups, activation, churn |
| Uptime monitoring | Don't know when down |

### 7.2 Deployment & Release
| Missing | Consequence |
|---------|-------------|
| CI/CD pipeline | Manual deploys; no preview environments |
| Database migration strategy | `schema.sql` run manually; no rollback |
| Feature flags | All-or-nothing releases |
| Rollback procedure | Unknown RTO |
| Secrets management | `.env.local` committed (security risk) |

### 7.3 Backup & Recovery
| Missing | Consequence |
|---------|-------------|
| Automated backups | RPO unknown |
| Point-in-time recovery | Can't recover from bad migration |
| Disaster recovery test | Unknown RTO |
| Cross-region replication | Single region failure = total outage |

---

## 8. Prioritized Remediation Roadmap

| Priority | Category | Action | Effort |
|----------|----------|--------|--------|
| **P0** | Architecture | Build backend API (Hono + Drizzle + Better Auth) | 3 weeks |
| **P0** | Database | Redesign schema (multi-tenant, variants, stock ledger) | 2 weeks |
| **P0** | Security | Implement RBAC, audit log, rate limiting, CSP | 2 weeks |
| **P0** | API | REST v1 + GraphQL, OpenAPI spec, webhooks | 2 weeks |
| **P0** | Frontend | Design system, mobile-first layout, PWA | 3 weeks |
| **P1** | Features | Multi-location, variants, PO workflow, supplier scorecards | 4 weeks |
| **P1** | Quality | Testing pyramid (Vitest, Playwright), CI/CD | 2 weeks |
| **P1** | Observability | Sentry, structured logs, metrics, uptime | 1 week |
| **P1** | DevOps | GitHub Actions, preview deploys, migrations, secrets | 1 week |
| **P2** | Features | Reports builder, forecasting, integrations | 4 weeks |
| **P2** | Platform | SSO, custom fields, marketplace apps | 3 weeks |

---

## 9. Conclusion

The legacy Stokku application is a **prototype built with v0.dev** — suitable for demo/validation but **not production-ready**. Every layer has fundamental gaps:

1. **No backend** — Business logic in frontend, direct DB access
2. **No multi-tenancy** — Single organization assumption throughout
3. **No API** — Integration impossible
4. **Broken mobile/accessibility** — Excludes warehouse floor users
5. **No testing/CI/CD** — Zero confidence in changes
6. **Security gaps** — No RBAC, audit, rate limiting
7. **Technical debt** — Dual data paths, localStorage, unpinned deps

**Recommendation**: Complete rebuild following the phased approach in PRD. Do not attempt incremental migration — the architecture is incompatible with target requirements.

---

*End of Pain Points Analysis*