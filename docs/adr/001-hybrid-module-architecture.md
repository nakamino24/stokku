# ADR-001: Hybrid Module Architecture

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Engineering Team  

## Problem

The product documentation specifies an Inventory Management System, while the implemented codebase is a Project Management application. These are fundamentally different domains with different entities, workflows, and data models. We need a unified architecture that supports both domains without duplication or contradiction.

## Context

- Current implementation: workspace-based project/task management
- Documentation requirement: inventory management (products, warehouses, suppliers, POs)
- Both share common infrastructure: auth, RBAC, organizations/workspaces, audit logging
- Monorepo with apps/api (Express) and apps/web (Next.js Pages Router)
- Database: SQLite via Prisma (dev), PostgreSQL planned for production

## Alternatives

### Alternative A: Full pivot to Inventory Management
Discard the project management code and rebuild to match PRD/SRS exactly.
- **Pros:** Clean slate, single domain focus, simpler data model
- **Cons:** Wastes existing implementation, less differentiated product

### Alternative B: Separate microservices
Deploy project management and inventory as independent services.
- **Pros:** Independent scaling, clear boundaries
- **Cons:** Premature for current stage, operational overhead, shared auth complexity

### Alternative C: Monolithic with modules (chosen)
Both domains in the same Express app, separated by feature modules, sharing common infrastructure.
- **Pros:** Shared auth/RBAC/workspace, simple deployment, unified API gateway, incremental adoption
- **Cons:** Must enforce module boundaries via code review, single deployment

## Decision

Adopt **Alternative C**: a module-based monolith where project management and inventory are separate feature modules within the same Express application, sharing workspace tenancy, authentication, and RBAC.

## Consequences

### Module structure
```
apps/api/src/
  modules/
    project-management/
      services/
      routes/
      schemas/
    inventory/
      services/
      routes/
      schemas/
  shared/          ← cross-cutting (auth, middleware, logger, errors)
  server.ts
```

### Database
- All tables scoped by `workspaceId` for tenancy
- Inventory tables prefixed conceptually as inventory_* or kept in same schema with clear naming

### API
- `/api/v1/projects/*` → project management
- `/api/v1/inventory/*` → inventory management
- Shared version prefix once ready

### Migration
- Incremental: implement inventory features one at a time
- Start with Products & Categories (foundational for all inventory flows)
- Follow with Suppliers, then Stock/Warehouses, then POs

### Risks
- Module boundary enforcement is manual (code review)
- Single deployment means inventory bugs can affect project management
- Mitigation: thorough testing, clear module boundaries
