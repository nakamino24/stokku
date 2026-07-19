# ADR-002: Product Catalog Module

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Engineering Team  

## Problem

The first inventory feature to implement is the Product Catalog — products with variants, hierarchical categories, SKU management, and supplier associations. We need a data model that supports multi-tenant isolation, variant management, and future stock tracking.

## Context

- Multi-tenant via Workspace (existing)
- Products must support variants (size, color, etc.) each with unique SKU
- Categories must support unlimited depth (tree structure)
- Products can have multiple suppliers
- Future: stock levels per variant × location, barcode generation, images
- Current DB: SQLite (dev) with Prisma ORM, PostgreSQL planned for production

## Alternatives

### Alternative A: Single Product table with JSONB variants
Store variants as JSON array on the product record.
- **Pros:** Simple schema, no joins for product list
- **Cons:** Can't query/filter by variant attributes, no FK constraints, harder to track stock per variant, Prisma JSON support limitations with SQLite

### Alternative B: Product + Variants as separate tables (chosen)
Normalized: `Product` (shared attributes) → `ProductVariant` (SKU, options, price, image).
- **Pros:** Proper FK constraints, queryable variant attributes, stock per variant, Prisma-native
- **Cons:** More joins, more complex CRUD

### Alternative C: EAV (Entity-Attribute-Value)
Custom attributes stored as key-value pairs.
- **Pros:** Maximum flexibility, no schema changes for new attributes
- **Cons:** Query nightmare, no type safety, complex validation, poor Prisma support

## Decision

**Alternative B**: Normalized Product + Variant tables.

### Category hierarchy
Use `parentId` self-referencing FK (adjacency list). Sufficient for SMB needs. Materialized path or nested sets can be added later if deep hierarchy queries become a bottleneck.

### SKU
- Unique per workspace
- Auto-generated from pattern or manually entered
- Validation enforced at service layer

## Schema Design

### Category
```
id          String  @id @default(uuid())
workspaceId String  (FK → Workspace)
parentId    String? (FK → Category, self)
name        String
slug        String
description String?
imageUrl    String?
color       String?
sortOrder   Int     @default(0)
isActive    Boolean @default(true)
createdAt   DateTime
updatedAt   DateTime
@@unique([workspaceId, slug])
```

### Product
```
id          String  @id @default(uuid())
workspaceId String  (FK → Workspace)
categoryId  String? (FK → Category)
name        String
description String?
baseUom     String  @default("pcs")  // unit of measure
status      String  @default("active")
tags        String  // JSON array stored as string (SQLite limitation)
createdAt   DateTime
updatedAt   DateTime
```

### ProductVariant
```
id             String  @id @default(uuid())
productId      String  (FK → Product, onDelete: Cascade)
sku            String
name           String  // e.g. "T-Shirt Red / Large"
barcode        String?
options         String  // JSON: { "Size": "L", "Color": "Red" }
price          Decimal? @default(0)
costPrice      Decimal? @default(0)
imageUrl       String?
sortOrder      Int     @default(0)
isActive       Boolean @default(true)
createdAt      DateTime
updatedAt      DateTime
@@unique([sku, productId])  // actually unique per workspace via validation
```

### ProductSupplier
```
id          String  @id @default(uuid())
productId   String  (FK → Product)
supplierId  String  (FK → Supplier)  // created later
supplierSku String?
leadTimeDays Int?
moq         Int?    // minimum order quantity
unitCost    Decimal?
isPreferred Boolean @default(false)
@@unique([productId, supplierId])
```

## API Endpoints

```
GET    /api/v1/inventory/categories        — list (tree)
POST   /api/v1/inventory/categories        — create
GET    /api/v1/inventory/categories/:id    — get
PATCH  /api/v1/inventory/categories/:id    — update
DELETE /api/v1/inventory/categories/:id    — delete (check children)

GET    /api/v1/inventory/products          — list (paginated, filterable)
POST   /api/v1/inventory/products          — create (with initial variant)
GET    /api/v1/inventory/products/:id      — get (with variants)
PATCH  /api/v1/inventory/products/:id      — update
DELETE /api/v1/inventory/products/:id      — soft delete
```

## Consequences

- All new tables scoped by `workspaceId`
- Product variant option values stored as JSON string (SQLite lacks JSON column)
- Migrating SQLite → PostgreSQL will allow native JSONB for options
- Product list queries include variant count (for display)
- Cascade delete: deleting a product removes all variants
