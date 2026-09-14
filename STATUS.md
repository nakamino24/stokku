# Reference Runtime: Stokku Status

> This status document describes the active Express, Prisma, and Pages Router
> reference implementation. It is operational evidence only, not the target product
> architecture. Canonical Phase 0 decisions are indexed in `docs/README.md`.

## Current Status

**Phase 0: Product and architecture re-baseline.** The current implementation is an
early operational WMS prototype. It is not approved for production use and no new
feature expansion should begin until the Phase 0 gate is accepted.

The production release is **NO-GO**. The blocking concerns are tracked in
`docs/Security.md` and `docs/ProductionReadiness.md`, with authentication,
authorization, dependency, and operational controls at the top of the list.

The local PostgreSQL-backed API suite currently passes, including health and WMS
inventory integration coverage. The database container is mapped to port 55432 in
the current workstation because another local PostgreSQL process owns port 5432.

## Current Reference Implementation

- Web: Next.js 13 Pages Router, React 18, deployed through Vercel
- API: Express 4 and TypeScript on Render
- Database: PostgreSQL through Prisma 5, intended for Neon
- Tests: Jest, Supertest, and Playwright
- Domain: organizations, catalog, warehouses, stock projections, inventory ledger,
  purchase orders, receipts, sales orders, allocations, and audit records

This code is a disposable reference implementation for business rules and workflow
discovery. The target rebuild is specified in `docs/architecture.md` and is not a
source-compatible migration.

## Running Locally

```powershell
# Start the development stack
docker compose -f docker-compose.dev.yml up -d

# Install deps + run migrations
pnpm install
cd packages/database
npx prisma migrate dev --name init

# Start dev servers
pnpm dev
```

API: http://localhost:4000 (health: http://localhost:4000/health)
Web: http://localhost:3000

If a native PostgreSQL service already uses port 5432, start Docker PostgreSQL with
`POSTGRES_PORT=55432 docker compose up -d postgres` and point `DATABASE_URL` and
`DIRECT_URL` at port 55432.

There is no deployed demo account. Create an account through registration and
complete email verification before accessing the application.
