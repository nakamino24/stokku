-- PostgreSQL baseline for Stokku's auditable WMS inventory core.
-- Existing PostgreSQL installations must follow docs/database-migration.md
-- and mark this baseline applied before running the upgrade migration.

CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER', 'VIEWER');
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CLOSED', 'CANCELLED', 'RETURNED');
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ALLOCATION', 'DEALLOCATION', 'PICK', 'PUTAWAY', 'SHIPMENT', 'RETURN', 'REVERSAL');
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'HOLD', 'QUARANTINE', 'DAMAGED');
CREATE TYPE "InventoryAllocationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'FULFILLED');
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('POSTED', 'REVERSED');
CREATE TYPE "AdjustmentReasonCode" AS ENUM ('DAMAGE', 'SHRINKAGE', 'COUNT_VARIANCE', 'EXPIRED', 'FOUND_STOCK', 'DATA_CORRECTION', 'QUALITY_REJECTION', 'RETURN_ADJUSTMENT', 'OTHER');
CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_ORDER', 'SALES_ORDER', 'GOODS_RECEIPT', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT');
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "googleId" TEXT,
  "name" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerificationToken" TEXT,
  "emailVerificationExpires" TIMESTAMP(3),
  "passwordResetToken" TEXT,
  "passwordResetExpires" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "OrganizationRole" NOT NULL DEFAULT 'VIEWER',
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganizationRole" NOT NULL DEFAULT 'VIEWER',
  "roleId" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "parentId" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "color" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "description" TEXT,
  "unitPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "costPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "taxRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL DEFAULT 'pcs',
  "minStock" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "maxStock" DECIMAL(18,6),
  "imageUrl" TEXT,
  "weight" DECIMAL(18,6),
  "weightUnit" TEXT NOT NULL DEFAULT 'kg',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "options" TEXT NOT NULL DEFAULT '{}',
  "unitPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "costPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "taxId" TEXT,
  "paymentTerms" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSupplier" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "supplierSku" TEXT,
  "leadTimeDays" INTEGER,
  "moq" DECIMAL(18,6),
  "unitCost" DECIMAL(18,6),
  "isPreferred" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "taxId" TEXT,
  "notes" TEXT,
  "creditLimit" DECIMAL(65,30),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "capacity" DECIMAL(18,6),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WarehouseZone" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WarehouseZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WarehouseBin" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "maxCapacity" DECIMAL(18,6),
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WarehouseBin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "poNumber" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDate" TIMESTAMP(3),
  "receivedDate" TIMESTAMP(3),
  "subtotal" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "quantity" DECIMAL(18,6) NOT NULL,
  "receivedQty" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "unitPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "soNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotal" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "allocatedAt" TIMESTAMP(3),
  "pickedAt" TIMESTAMP(3),
  "packedAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesOrderItem" (
  "id" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "quantity" DECIMAL(18,6) NOT NULL,
  "unitPrice" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(24,6) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockLevel" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "binId" TEXT,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "inventoryStatus" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
  "lotNumber" TEXT,
  "serialNumber" TEXT,
  "onHand" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "allocated" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "hold" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "available" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "reorderPoint" DECIMAL(18,6),
  "reorderQty" DECIMAL(18,6),
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockLevel_non_negative_check" CHECK (
    "onHand" >= 0 AND "allocated" >= 0 AND "hold" >= 0 AND "available" >= 0
  ),
  CONSTRAINT "StockLevel_available_check" CHECK ("available" = "onHand" - "allocated" - "hold")
);

CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" "StockMovementType" NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "warehouseId" TEXT,
  "fromWarehouseId" TEXT,
  "toWarehouseId" TEXT,
  "stockLevelId" TEXT,
  "quantity" DECIMAL(18,6) NOT NULL,
  "onHandDelta" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "allocatedDelta" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "holdDelta" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "beforeOnHand" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "afterOnHand" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "beforeAllocated" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "afterAllocated" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "beforeHold" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "afterHold" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "beforeAvailable" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "afterAvailable" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "unitPrice" DECIMAL(18,6),
  "totalPrice" DECIMAL(24,6),
  "sourceDocumentType" TEXT,
  "sourceDocumentId" TEXT,
  "reference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT,
  "reasonCode" "AdjustmentReasonCode",
  "reason" TEXT,
  "note" TEXT,
  "reversalOfId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockMovement_positive_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "StockMovement_on_hand_chain_check" CHECK ("afterOnHand" = "beforeOnHand" + "onHandDelta"),
  CONSTRAINT "StockMovement_allocated_chain_check" CHECK ("afterAllocated" = "beforeAllocated" + "allocatedDelta"),
  CONSTRAINT "StockMovement_hold_chain_check" CHECK ("afterHold" = "beforeHold" + "holdDelta"),
  CONSTRAINT "StockMovement_before_available_check" CHECK ("beforeAvailable" = "beforeOnHand" - "beforeAllocated" - "beforeHold"),
  CONSTRAINT "StockMovement_after_available_check" CHECK ("afterAvailable" = "afterOnHand" - "afterAllocated" - "afterHold")
);

CREATE TABLE "InventoryAllocation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "salesOrderItemId" TEXT NOT NULL,
  "stockLevelId" TEXT NOT NULL,
  "quantity" DECIMAL(18,6) NOT NULL,
  "status" "InventoryAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
  "idempotencyKey" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  CONSTRAINT "InventoryAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryAllocation_positive_quantity_check" CHECK ("quantity" > 0)
);

CREATE TABLE "GoodsReceipt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "binId" TEXT,
  "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'POSTED',
  "supplierDeliveryReference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "receivedById" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoodsReceiptLine" (
  "id" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "purchaseOrderItemId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "expectedQty" DECIMAL(18,6) NOT NULL,
  "receivedQty" DECIMAL(18,6) NOT NULL,
  "acceptedQty" DECIMAL(18,6) NOT NULL,
  "rejectedQty" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoodsReceiptLine_quantity_check" CHECK (
    "expectedQty" >= 0 AND "receivedQty" > 0 AND "acceptedQty" >= 0 AND "rejectedQty" >= 0
    AND "acceptedQty" + "rejectedQty" = "receivedQty"
  )
);

CREATE TABLE "DocumentSequence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentSequence_non_negative_check" CHECK ("lastNumber" >= 0)
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "oldValues" TEXT,
  "newValues" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_ownerId_key" ON "Organization"("ownerId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX "OrganizationMember_roleId_idx" ON "OrganizationMember"("roleId");
CREATE UNIQUE INDEX "Role_organizationId_slug_key" ON "Role"("organizationId", "slug");
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");
CREATE UNIQUE INDEX "RolePermission_roleId_permission_key" ON "RolePermission"("roleId", "permission");
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE UNIQUE INDEX "Category_organizationId_slug_key" ON "Category"("organizationId", "slug");
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON "Product"("organizationId", "sku");
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
CREATE UNIQUE INDEX "ProductVariant_sku_productId_key" ON "ProductVariant"("sku", "productId");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_barcode_idx" ON "ProductVariant"("barcode");
CREATE UNIQUE INDEX "ProductSupplier_productId_supplierId_key" ON "ProductSupplier"("productId", "supplierId");
CREATE INDEX "ProductSupplier_supplierId_idx" ON "ProductSupplier"("supplierId");
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE UNIQUE INDEX "Warehouse_organizationId_code_key" ON "Warehouse"("organizationId", "code");
CREATE INDEX "Warehouse_organizationId_idx" ON "Warehouse"("organizationId");
CREATE UNIQUE INDEX "WarehouseZone_warehouseId_code_key" ON "WarehouseZone"("warehouseId", "code");
CREATE INDEX "WarehouseZone_warehouseId_idx" ON "WarehouseZone"("warehouseId");
CREATE UNIQUE INDEX "WarehouseBin_zoneId_code_key" ON "WarehouseBin"("zoneId", "code");
CREATE INDEX "WarehouseBin_zoneId_idx" ON "WarehouseBin"("zoneId");
CREATE UNIQUE INDEX "PurchaseOrder_organizationId_poNumber_key" ON "PurchaseOrder"("organizationId", "poNumber");
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");
CREATE UNIQUE INDEX "SalesOrder_organizationId_soNumber_key" ON "SalesOrder"("organizationId", "soNumber");
CREATE INDEX "SalesOrder_organizationId_idx" ON "SalesOrder"("organizationId");
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");
CREATE INDEX "SalesOrderItem_productId_idx" ON "SalesOrderItem"("productId");

-- PostgreSQL 15+ treats NULL identity components as equal for this index.
CREATE UNIQUE INDEX "StockLevel_inventory_identity_key"
  ON "StockLevel" (
    "organizationId", "warehouseId", "binId", "productId", "variantId",
    "inventoryStatus", "lotNumber", "serialNumber"
  ) NULLS NOT DISTINCT;
CREATE INDEX "StockLevel_organizationId_warehouseId_productId_variantId_binId_inventoryStatus_idx"
  ON "StockLevel"("organizationId", "warehouseId", "productId", "variantId", "binId", "inventoryStatus");
CREATE INDEX "StockLevel_productId_idx" ON "StockLevel"("productId");
CREATE INDEX "StockLevel_variantId_idx" ON "StockLevel"("variantId");
CREATE INDEX "StockLevel_warehouseId_idx" ON "StockLevel"("warehouseId");
CREATE INDEX "StockLevel_organizationId_idx" ON "StockLevel"("organizationId");
CREATE INDEX "StockLevel_reorderPoint_idx" ON "StockLevel"("reorderPoint");
CREATE UNIQUE INDEX "StockMovement_organizationId_idempotencyKey_key" ON "StockMovement"("organizationId", "idempotencyKey");
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX "StockMovement_variantId_idx" ON "StockMovement"("variantId");
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");
CREATE INDEX "StockMovement_organizationId_idx" ON "StockMovement"("organizationId");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_sourceDocumentType_sourceDocumentId_idx" ON "StockMovement"("sourceDocumentType", "sourceDocumentId");
CREATE INDEX "StockMovement_correlationId_idx" ON "StockMovement"("correlationId");
CREATE UNIQUE INDEX "InventoryAllocation_organizationId_idempotencyKey_key" ON "InventoryAllocation"("organizationId", "idempotencyKey");
CREATE UNIQUE INDEX "InventoryAllocation_salesOrderItemId_stockLevelId_key" ON "InventoryAllocation"("salesOrderItemId", "stockLevelId");
CREATE INDEX "InventoryAllocation_organizationId_status_idx" ON "InventoryAllocation"("organizationId", "status");
CREATE INDEX "InventoryAllocation_salesOrderId_idx" ON "InventoryAllocation"("salesOrderId");
CREATE INDEX "InventoryAllocation_stockLevelId_idx" ON "InventoryAllocation"("stockLevelId");
CREATE UNIQUE INDEX "GoodsReceipt_organizationId_receiptNumber_key" ON "GoodsReceipt"("organizationId", "receiptNumber");
CREATE UNIQUE INDEX "GoodsReceipt_organizationId_idempotencyKey_key" ON "GoodsReceipt"("organizationId", "idempotencyKey");
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");
CREATE INDEX "GoodsReceipt_warehouseId_idx" ON "GoodsReceipt"("warehouseId");
CREATE UNIQUE INDEX "GoodsReceiptLine_goodsReceiptId_purchaseOrderItemId_key" ON "GoodsReceiptLine"("goodsReceiptId", "purchaseOrderItemId");
CREATE INDEX "GoodsReceiptLine_purchaseOrderItemId_idx" ON "GoodsReceiptLine"("purchaseOrderItemId");
CREATE INDEX "GoodsReceiptLine_productId_idx" ON "GoodsReceiptLine"("productId");
CREATE UNIQUE INDEX "DocumentSequence_organizationId_documentType_year_key" ON "DocumentSequence"("organizationId", "documentType", "year");
CREATE INDEX "DocumentSequence_organizationId_idx" ON "DocumentSequence"("organizationId");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX "RefreshSession_familyId_idx" ON "RefreshSession"("familyId");
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

ALTER TABLE "User" ADD CONSTRAINT "user_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarehouseZone" ADD CONSTRAINT "WarehouseZone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarehouseBin" ADD CONSTRAINT "WarehouseBin_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "WarehouseZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_binId_fkey" FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "StockLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "StockLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_binId_fkey" FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentSequence" ADD CONSTRAINT "DocumentSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Posted inventory transactions are immutable; create a reversal instead';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "StockMovement_immutable"
BEFORE UPDATE OR DELETE ON "StockMovement"
FOR EACH ROW EXECUTE FUNCTION prevent_stock_movement_mutation();
