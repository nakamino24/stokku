# Stokku — Inventory Management System

## Current Status

Phase 5 complete (Feature Implementation). Ready for Phase 6 (Review).

## What Changed

### Product Focus
- **Before**: Hybrid PM + Inventory app (Projects, Tasks, Comments, Portfolio)
- **After**: Pure Inventory Management System for SMBs

### Database (PostgreSQL)
- Removed: Project, Task, Comment, Attachment, Notification, Workspace, WorkspaceMember
- Added: Organization (multi-tenant), Customer, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, WarehouseZone, WarehouseBin, AuditLog, Role, RolePermission
- PostgreSQL enums for status tracking on all stateful entities
- Proper cascade deletes and composite unique constraints

### API (Express + TypeScript)
- Feature-based module architecture (`/modules/<feature>/`)
- API versioned at `/api/v1/`
- All 14 modules: auth, dashboard, products, categories, suppliers, customers, warehouses, stock, purchase-orders, sales-orders, reports, users, roles, settings
- Zod validation, RBAC middleware, audit logging
- Hardcoded JWT secret removed (reads from env only)

### Frontend (Next.js + React)
- Navigation redesigned for inventory workflows (Dashboard → Inventory → Warehouses → Purchasing → Sales → Reports → Administration)
- 13 pages: Dashboard, Products, Categories, Stock, Warehouses, Purchase Orders, Suppliers, Sales Orders, Customers, Reports, Users, Settings
- API client utility with auto-auth-header
- Consistent Card-based layouts with loading, error, and empty states

### Project Structure
- Removed 4 empty packages: `@stokku/shared`, `@stokku/types`, `@stokku/validation`, `@stokku/config`
- Now: `apps/api`, `apps/web`, `packages/database`, `packages/ui`

## Running Locally

```powershell
# Start PostgreSQL
docker compose up -d

# Install deps + run migrations + seed
pnpm install
cd packages/database
npx prisma migrate dev --name init
npx prisma db seed

# Start dev servers
pnpm dev
```

API: http://localhost:3001 (health: http://localhost:3001/health)
Web: http://localhost:3000

Demo login: demo@stokku.app / password123
