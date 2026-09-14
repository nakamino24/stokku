# Technology Stack Decision

**Status:** Phase 0 proposed baseline
**Decision owner:** Engineering

## 1. Selected Stack

| Layer             | Selection                                              | Reason                                                           |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Runtime           | Node.js 22 LTS, TypeScript strict                      | Supported server runtime and shared language                     |
| Web               | Next.js App Router, React 19, TypeScript               | Accessible responsive web and tablet UI with route boundaries    |
| API               | Hono on Node.js, REST, OpenAPI                         | Small HTTP layer, explicit contracts, portable runtime           |
| Domain            | Pure TypeScript application services                   | Testable inventory rules without HTTP or ORM coupling            |
| Database          | PostgreSQL 16+ on Neon                                 | ACID transactions, numeric quantities, constraints, standard SQL |
| Database access   | Drizzle ORM plus parameterized SQL where needed        | Transparent transactions and PostgreSQL control                  |
| Authentication    | Better Auth primitives with Argon2id password adapter  | Session lifecycle without outsourcing authorization policy       |
| Validation        | Zod contracts shared by API and web                    | One boundary schema and generated types                          |
| State             | TanStack Query for server state; URL state first       | Cache, dedupe, retry, and safe mutation handling                 |
| UI                | Owned `@stokku/ui` on accessible headless primitives   | Consistent warehouse-specific interaction patterns               |
| Jobs              | PostgreSQL outbox and one worker process when required | Durable delivery without premature queue infrastructure          |
| Unit tests        | Vitest                                                 | Fast TypeScript tests and domain-focused execution               |
| Integration tests | Testcontainers PostgreSQL                              | Real constraints, transactions, and isolation behavior           |
| E2E               | Playwright                                             | Browser, mobile viewport, and network-failure coverage           |
| Quality           | ESLint, Prettier, Husky, lint-staged, commitlint       | Consistent changes and predictable CI                            |

The exact package versions are pinned in the implementation phase only after
compatibility testing. Unsupported framework versions are never accepted merely to
preserve an existing lockfile.

## 2. Free Platform Evaluation

| Option                    | Strength                                    | Limitation for Stokku                                                   | Decision                               |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| Render + Neon             | Simple Node deployment plus real PostgreSQL | Free API sleeps; limited availability                                   | Selected for pilot and demo            |
| Railway                   | Easy services and databases                 | Free usage and billing limits change; less predictable                  | Alternative                            |
| Fly.io                    | Full container control and regions          | More operations; database remains external                              | Alternative if Render limits execution |
| Cloudflare Workers + D1   | Cheap edge execution                        | SQLite differences and transaction model complicate WMS invariants      | Rejected initially                     |
| Cloudflare Workers + Neon | Edge API and PostgreSQL                     | Connection/runtime constraints add complexity                           | Future evaluation                      |
| Appwrite                  | Auth, database, storage in one product      | Less control over relational WMS transactions and migration portability | Rejected                               |
| Convex                    | Excellent reactive developer experience     | Proprietary data model and weaker SQL portability                       | Rejected                               |
| PocketBase                | Very low-cost single binary                 | SQLite and scaling model are unsuitable for inventory ledger growth     | Rejected                               |
| Firebase                  | Mature managed identity and messaging       | No relational integrity; vendor lock-in                                 | Rejected                               |
| Nhost                     | PostgreSQL and GraphQL platform             | GraphQL-first surface is not needed for command workflows               | Rejected                               |
| Self-hosted PostgreSQL    | Maximum control                             | Backup, patching, availability, and on-call burden                      | Rejected for pilot                     |

**Recommendation:** Vercel for the web, Render for the API, and Neon for
PostgreSQL are the best free development and controlled-pilot combination for this
application. They are not a production availability guarantee. A paid or higher
reliability profile must be selected before a public SaaS launch.

## 3. Design Constraints

- The API is stateless except for database-backed sessions and transaction state.
- PostgreSQL connection pooling and maximum connections must be measured before
  increasing concurrency.
- Redis is not a core dependency. Add it only for a measured cache/rate-limit need.
- Real-time updates begin with refetch or server-sent events only where useful; do
  not add WebSockets to every screen.
- External email and webhook delivery is asynchronous and never part of a stock
  posting transaction.
- Public API consumers receive OpenAPI-generated contracts, not ORM types.
