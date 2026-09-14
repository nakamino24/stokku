# Stokku

Stokku is a task-oriented warehouse management system for growing businesses that
need reliable inventory truth across multiple warehouses.

The product flow is:

`Plan inventory -> Receive -> Inspect and put away -> Store and count -> Allocate -> Pick -> Pack -> Ship -> Reconcile`

## Project State

The repository currently contains an early WMS reference implementation used for
domain discovery. The current production release is **NO-GO**. Phase 0 decisions
are approved; source migration proceeds through one tested vertical slice at a time.

Read these documents first:

- `docs/README.md`: documentation authority and phase gate
- `docs/PRD.md`: product scope, users, priorities, and success measures
- `docs/SRS.md`: testable requirements
- `docs/architecture.md`: target system boundaries and runtime architecture
- `docs/Database.md`: target domain model, invariants, and ERD
- `docs/API.md`: versioned REST contract
- `docs/Security.md`: threat model and release-blocking controls
- `docs/ProductionReadiness.md`: launch checklist
- `docs/repository-structure.md`: target layout, dependency rules, and transition order
- `docs/adr/0016-target-architecture-transition.md`: incremental migration decision

## Local Reference App

The current reference app uses PostgreSQL, an Express API, and a Next.js Pages
Router web app. Its operational documentation is classified in
`docs/reference/runtime/`. The local setup is:

```powershell
docker compose -f docker-compose.dev.yml up -d
pnpm install
pnpm --filter @stokku/database exec prisma migrate deploy
pnpm dev
```

The application reads `DATABASE_URL` and `DIRECT_URL` from the environment. Never
commit Neon credentials. Production deployments configure both values as Render
secrets; local development may use the Docker PostgreSQL service.

The API runs at `http://localhost:4000` and the web app at
`http://localhost:3000`.

## Engineering Rule

Do not add WMS features to the reference implementation until the Phase 0 gate is
accepted. Security containment may proceed independently, but production
authentication and tenant authorization must pass their release gates before any
controlled pilot.
