# Target Architecture

**Status:** Phase 0 proposed baseline
**Decision:** Modular monolith with explicit domain boundaries

## 1. Architecture Decision

Stokku will launch as a feature-first modular monolith. The web application, API,
and optional worker are separate deployable applications, but the core business
logic remains in one versioned codebase and one PostgreSQL database.

This is a deliberate choice for an early WMS. Inventory correctness, transaction
boundaries, and operational simplicity are more valuable than independent service
scaling. A service may be extracted only after a measured bottleneck and a new ADR.

## 2. Runtime Topology

```text
Warehouse browser or scanner
          |
          | HTTPS, secure session, CSRF/origin controls
          v
Vercel: Next.js web application
          |
          | server-side API origin; browser uses same-origin /api/v1
          v
Render: Node.js API application
          |
          | Drizzle transactions, tenant context, named commands
          v
Neon: PostgreSQL primary database

Optional asynchronous path:
API -> outbox_events -> worker -> email, exports, or signed webhooks
```

The initial topology preserves the current Vercel -> Render -> PostgreSQL shape
only as an operational deployment choice. It does not preserve the current source
code, API implementation, schema, or authentication behavior.

## 3. Applications

```text
apps/
  web/       Next.js App Router; browser-safe UI and server rendering
  api/       Hono on Node.js; versioned REST and command orchestration
  worker/    Optional jobs; no direct user-facing business mutations

packages/
  domain/        Pure workflow rules and value objects
  contracts/     API DTOs, OpenAPI schemas, error codes
  validation/    Shared boundary schemas; no database access
  database/      Drizzle schema, migrations, repositories, transaction helpers
  ui/            Accessible design system and warehouse interaction patterns
  config/        Environment parsing and safe configuration contracts
  test-fixtures/ Builders and isolated fixtures for disposable test databases
```

## 4. Dependency Rules

- `domain` depends on no HTTP framework, React, ORM, or environment variables.
- `contracts` depends only on serializable types and validation primitives.
- `database` implements repository ports needed by domain/application commands.
- API route handlers translate HTTP to command inputs and command results. They do
  not calculate stock, decide permissions, or mutate database records directly.
- Web code calls the API only. It never imports database clients or server secrets.
- Worker jobs consume outbox records and may call application services through a
  narrow job interface. They do not bypass command authorization rules.
- Cross-feature imports require a published application service or domain event;
  importing another feature's repository is prohibited.

## 5. Request and Command Flow

1. Middleware creates or validates a request ID and applies size, origin, and rate
   limits.
2. Authentication validates the session or integration credential.
3. Organization context resolves the active membership; a supplied organization ID
   is treated as a selector, never as proof of access.
4. Authorization verifies permission and, when applicable, warehouse scope.
5. The route validates the request using a shared contract.
6. The application service executes one named command in a transaction.
7. The transaction writes the immutable business record, ledger entries, audit event,
   idempotency result, and outbox event as one unit where applicable.
8. The route maps the result to an allowlisted response DTO and returns the request ID.

## 6. Feature Modules

| Module          | Owns                                           | Representative commands                                |
| --------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `auth`          | Identity and sessions                          | register, verify email, reset password, revoke session |
| `organizations` | Membership and settings                        | invite member, assign role, change active organization |
| `catalog`       | Product, SKU, UOM, supplier links              | create SKU, archive SKU, set reorder policy            |
| `warehouses`    | Warehouse, zone, bin, scopes                   | create bin, assign operator scope                      |
| `inventory`     | Ledger, balance projection, adjustments        | post adjustment, reverse movement, reconcile           |
| `inbound`       | Purchase orders, receipts, inspection, putaway | submit PO, post receipt, complete putaway              |
| `outbound`      | Sales orders and allocation                    | confirm order, allocate stock, release allocation      |
| `execution`     | Pick, pack, shipment tasks                     | claim pick, confirm pack, confirm shipment             |
| `reporting`     | Authorized read models and exports             | run movement report, enqueue export                    |
| `audit`         | Protected audit query and integrity checks     | query audit, export audit evidence                     |

## 7. Persistence Rules

- PostgreSQL is the source of truth for posted inventory effects.
- The inventory ledger is append-only. `inventory_balances` is a projection used for
  fast reads and is repairable from the ledger.
- All inventory writes use an explicit transaction isolation and retry policy.
- Every retriable command has an organization-scoped idempotency key.
- Posted documents are immutable. A correction is a reversal or compensating entry.
- Repositories require an organization scope parameter. A repository method without
  tenant scope is not permitted for business data.
- PostgreSQL row-level security is defense in depth. API transactions set a local
  tenant context; privileged migrations and maintenance use a separate role.

## 8. Observability

Every request and command emits a structured event with request ID, organization ID,
actor ID, command name, outcome, duration, and safe error code. Secrets, cookies,
authorization headers, passwords, token material, and full customer payloads are
never logged. Metrics cover authentication failures, authorization denials,
inventory posting failures, transaction retries, queue age, and endpoint latency.

## 9. Alternatives Rejected

- Microservices: too much operational and consistency overhead for the pilot.
- Cloudflare Workers as the initial API runtime: attractive edge economics, but
  unnecessary for transaction-heavy PostgreSQL work and less convenient for the
  selected Node tooling.
- GraphQL as the primary API: flexible reads do not justify a second contract and
  authorization surface before the REST command model is stable.
- Direct frontend database access: unacceptable tenant, validation, and audit risk.
