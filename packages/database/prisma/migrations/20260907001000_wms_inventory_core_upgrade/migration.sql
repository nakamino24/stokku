-- Upgrade an existing PostgreSQL installation that previously used Prisma
-- db push. Fresh installations already have the target shape from the
-- preceding baseline, so every legacy-only alteration is guarded.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StockLevel' AND column_name = 'quantity'
  ) THEN
    IF EXISTS (SELECT 1 FROM "StockLevel" WHERE "quantity" < 0) THEN
      RAISE EXCEPTION 'Migration blocked: negative legacy stock requires remediation before upgrade';
    END IF;
    IF EXISTS (
      SELECT 1 FROM "StockLevel" balance
      WHERE NOT EXISTS (
        SELECT 1 FROM "User" actor WHERE actor."organizationId" = balance."organizationId"
      )
    ) THEN
      RAISE EXCEPTION 'Migration blocked: every stocked organization requires an audit actor';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM (
        SELECT orders."organizationId", item."productId", COALESCE(item."variantId", '') AS variant_key,
               SUM(item."quantity") AS demand
        FROM "SalesOrderItem" item
        JOIN "SalesOrder" orders ON orders."id" = item."salesOrderId"
        WHERE orders."status"::text IN ('CONFIRMED', 'PICKING', 'SHIPPING')
        GROUP BY orders."organizationId", item."productId", COALESCE(item."variantId", '')
      ) demand
      LEFT JOIN (
        SELECT "organizationId", "productId", COALESCE("variantId", '') AS variant_key,
               SUM("quantity") AS supply
        FROM "StockLevel"
        GROUP BY "organizationId", "productId", COALESCE("variantId", '')
      ) supply USING ("organizationId", "productId", variant_key)
      WHERE demand.demand > COALESCE(supply.supply, 0)
    ) THEN
      RAISE EXCEPTION 'Migration blocked: open sales-order demand exceeds physical stock';
    END IF;
    ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'ALLOCATED';
    ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'PICKED';
    ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
    ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';
    ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'RECEIPT';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'ISSUE';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'ALLOCATION';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'DEALLOCATION';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'PICK';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'PUTAWAY';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'SHIPMENT';
    ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'REVERSAL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryStatus') THEN
    CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'HOLD', 'QUARANTINE', 'DAMAGED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryAllocationStatus') THEN
    CREATE TYPE "InventoryAllocationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'FULFILLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoodsReceiptStatus') THEN
    CREATE TYPE "GoodsReceiptStatus" AS ENUM ('POSTED', 'REVERSED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdjustmentReasonCode') THEN
    CREATE TYPE "AdjustmentReasonCode" AS ENUM ('DAMAGE', 'SHRINKAGE', 'COUNT_VARIANCE', 'EXPIRED', 'FOUND_STOCK', 'DATA_CORRECTION', 'QUALITY_REJECTION', 'RETURN_ADJUSTMENT', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
    CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_ORDER', 'SALES_ORDER', 'GOODS_RECEIPT', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "InventoryAllocation" (
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
  CONSTRAINT "InventoryAllocation_positive_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "InventoryAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryAllocation_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryAllocation_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryAllocation_stockLevelId_fkey" FOREIGN KEY ("stockLevelId") REFERENCES "StockLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GoodsReceipt" (
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
  CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GoodsReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceipt_binId_fkey" FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GoodsReceiptLine" (
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
  CONSTRAINT "GoodsReceiptLine_quantity_check" CHECK ("expectedQty" >= 0 AND "receivedQty" > 0 AND "acceptedQty" >= 0 AND "rejectedQty" >= 0 AND "acceptedQty" + "rejectedQty" = "receivedQty"),
  CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceiptLine_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GoodsReceiptLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DocumentSequence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentSequence_non_negative_check" CHECK ("lastNumber" >= 0),
  CONSTRAINT "DocumentSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InventoryAllocation_organizationId_idempotencyKey_key" ON "InventoryAllocation"("organizationId", "idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryAllocation_salesOrderItemId_stockLevelId_key" ON "InventoryAllocation"("salesOrderItemId", "stockLevelId");
CREATE INDEX IF NOT EXISTS "InventoryAllocation_organizationId_status_idx" ON "InventoryAllocation"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "InventoryAllocation_salesOrderId_idx" ON "InventoryAllocation"("salesOrderId");
CREATE INDEX IF NOT EXISTS "InventoryAllocation_stockLevelId_idx" ON "InventoryAllocation"("stockLevelId");
CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceipt_organizationId_receiptNumber_key" ON "GoodsReceipt"("organizationId", "receiptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceipt_organizationId_idempotencyKey_key" ON "GoodsReceipt"("organizationId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "GoodsReceipt_warehouseId_idx" ON "GoodsReceipt"("warehouseId");
CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceiptLine_goodsReceiptId_purchaseOrderItemId_key" ON "GoodsReceiptLine"("goodsReceiptId", "purchaseOrderItemId");
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_purchaseOrderItemId_idx" ON "GoodsReceiptLine"("purchaseOrderItemId");
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_productId_idx" ON "GoodsReceiptLine"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentSequence_organizationId_documentType_year_key" ON "DocumentSequence"("organizationId", "documentType", "year");
CREATE INDEX IF NOT EXISTS "DocumentSequence_organizationId_idx" ON "DocumentSequence"("organizationId");

-- Enum values added by the previous statement are committed before this block.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StockLevel' AND column_name = 'quantity'
  ) THEN
    UPDATE "SalesOrder" SET "status" = 'PACKED' WHERE "status"::text = 'SHIPPING';
    UPDATE "StockMovement" SET "type" = 'RECEIPT' WHERE "type"::text = 'IN';
    UPDATE "StockMovement" SET "type" = 'ISSUE' WHERE "type"::text = 'OUT';
    UPDATE "StockMovement" SET "type" = 'TRANSFER_OUT' WHERE "type"::text = 'TRANSFER';
    DROP INDEX IF EXISTS "StockLevel_warehouseId_productId_variantId_binId_key";
    UPDATE "StockLevel" SET "variantId" = NULL WHERE "variantId" = '';
    UPDATE "StockLevel" SET "binId" = NULL WHERE "binId" = '';
    UPDATE "StockMovement" SET "variantId" = NULL WHERE "variantId" = '';
    UPDATE "PurchaseOrderItem" SET "variantId" = NULL WHERE "variantId" = '';
    UPDATE "SalesOrderItem" SET "variantId" = NULL WHERE "variantId" = '';

    ALTER TABLE "StockLevel" RENAME COLUMN "quantity" TO "onHand";
    ALTER TABLE "StockLevel" RENAME COLUMN "reserved" TO "allocated";
    ALTER TABLE "StockLevel" ADD COLUMN "hold" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockLevel" ADD COLUMN "inventoryStatus" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE';
    ALTER TABLE "StockLevel" ADD COLUMN "lotNumber" TEXT;
    ALTER TABLE "StockLevel" ADD COLUMN "serialNumber" TEXT;
    ALTER TABLE "StockLevel" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE "StockLevel" ALTER COLUMN "onHand" TYPE DECIMAL(18,6) USING "onHand"::DECIMAL(18,6);
    ALTER TABLE "StockLevel" ALTER COLUMN "allocated" TYPE DECIMAL(18,6) USING "allocated"::DECIMAL(18,6);
    ALTER TABLE "StockLevel" ALTER COLUMN "available" TYPE DECIMAL(18,6) USING "available"::DECIMAL(18,6);
    ALTER TABLE "StockLevel" ALTER COLUMN "reorderPoint" TYPE DECIMAL(18,6) USING "reorderPoint"::DECIMAL(18,6);
    ALTER TABLE "StockLevel" ALTER COLUMN "reorderQty" TYPE DECIMAL(18,6) USING "reorderQty"::DECIMAL(18,6);
    -- Legacy reservations include DRAFT/zombie rows; exact active allocations
    -- are rebuilt after identities and the physical ledger are reconciled.
    UPDATE "StockLevel" SET "allocated" = 0, "available" = "onHand";

    ALTER TABLE "Product" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "Product" ALTER COLUMN "costPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "Product" ALTER COLUMN "taxRate" TYPE DECIMAL(9,6);
    ALTER TABLE "Product" ALTER COLUMN "minStock" TYPE DECIMAL(18,6) USING "minStock"::DECIMAL(18,6);
    ALTER TABLE "Product" ALTER COLUMN "maxStock" TYPE DECIMAL(18,6) USING "maxStock"::DECIMAL(18,6);
    ALTER TABLE "Product" ALTER COLUMN "weight" TYPE DECIMAL(18,6);
    ALTER TABLE "ProductVariant" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "ProductVariant" ALTER COLUMN "costPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "ProductSupplier" ALTER COLUMN "moq" TYPE DECIMAL(18,6) USING "moq"::DECIMAL(18,6);
    ALTER TABLE "ProductSupplier" ALTER COLUMN "unitCost" TYPE DECIMAL(18,6);
    ALTER TABLE "Warehouse" ALTER COLUMN "capacity" TYPE DECIMAL(18,6) USING "capacity"::DECIMAL(18,6);
    ALTER TABLE "WarehouseBin" ALTER COLUMN "maxCapacity" TYPE DECIMAL(18,6) USING "maxCapacity"::DECIMAL(18,6);
    ALTER TABLE "PurchaseOrder" ALTER COLUMN "subtotal" TYPE DECIMAL(24,6);
    ALTER TABLE "PurchaseOrder" ALTER COLUMN "taxAmount" TYPE DECIMAL(24,6);
    ALTER TABLE "PurchaseOrder" ALTER COLUMN "totalAmount" TYPE DECIMAL(24,6);
    ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
    ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "receivedQty" TYPE DECIMAL(18,6) USING "receivedQty"::DECIMAL(18,6);
    ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "totalPrice" TYPE DECIMAL(24,6);
    ALTER TABLE "SalesOrder" ALTER COLUMN "subtotal" TYPE DECIMAL(24,6);
    ALTER TABLE "SalesOrder" ALTER COLUMN "taxAmount" TYPE DECIMAL(24,6);
    ALTER TABLE "SalesOrder" ALTER COLUMN "totalAmount" TYPE DECIMAL(24,6);
    ALTER TABLE "SalesOrderItem" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
    ALTER TABLE "SalesOrderItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "SalesOrderItem" ALTER COLUMN "totalPrice" TYPE DECIMAL(24,6);

    ALTER TABLE "StockMovement" RENAME COLUMN "beforeQty" TO "beforeOnHand";
    ALTER TABLE "StockMovement" RENAME COLUMN "afterQty" TO "afterOnHand";
    ALTER TABLE "StockMovement" ALTER COLUMN "quantity" TYPE DECIMAL(18,6)
      USING GREATEST(ABS("quantity"::DECIMAL(18,6)), 0.000001);
    ALTER TABLE "StockMovement" ALTER COLUMN "beforeOnHand" TYPE DECIMAL(18,6) USING "beforeOnHand"::DECIMAL(18,6);
    ALTER TABLE "StockMovement" ALTER COLUMN "afterOnHand" TYPE DECIMAL(18,6) USING "afterOnHand"::DECIMAL(18,6);
    ALTER TABLE "StockMovement" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,6);
    ALTER TABLE "StockMovement" ALTER COLUMN "totalPrice" TYPE DECIMAL(24,6);
    ALTER TABLE "StockMovement" ADD COLUMN "onHandDelta" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "allocatedDelta" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "holdDelta" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "beforeAllocated" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "afterAllocated" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "beforeHold" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "afterHold" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "beforeAvailable" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "afterAvailable" DECIMAL(18,6) NOT NULL DEFAULT 0;
    ALTER TABLE "StockMovement" ADD COLUMN "sourceDocumentType" TEXT;
    ALTER TABLE "StockMovement" ADD COLUMN "sourceDocumentId" TEXT;
    ALTER TABLE "StockMovement" ADD COLUMN "idempotencyKey" TEXT;
    ALTER TABLE "StockMovement" ADD COLUMN "correlationId" TEXT;
    ALTER TABLE "StockMovement" ADD COLUMN "reasonCode" "AdjustmentReasonCode";
    ALTER TABLE "StockMovement" ADD COLUMN "reversalOfId" TEXT;
    UPDATE "StockMovement" SET
      "onHandDelta" = "afterOnHand" - "beforeOnHand",
      "beforeAvailable" = "beforeOnHand",
      "afterAvailable" = "afterOnHand",
      "sourceDocumentType" = "referenceType",
      "sourceDocumentId" = "referenceId",
      "idempotencyKey" = 'LEGACY:' || "id";
    ALTER TABLE "StockMovement" ALTER COLUMN "idempotencyKey" SET NOT NULL;
    ALTER TABLE "StockMovement" DROP COLUMN "referenceType";
    ALTER TABLE "StockMovement" DROP COLUMN "referenceId";

    ALTER TABLE "SalesOrder" ADD COLUMN "confirmedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "allocatedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "pickedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "packedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "shippedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "deliveredAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "closedAt" TIMESTAMP(3);
    ALTER TABLE "SalesOrder" ADD COLUMN "cancelledAt" TIMESTAMP(3);
    ALTER TABLE "OrganizationMember" ADD COLUMN "roleId" TEXT;

    ALTER TABLE "SalesOrder" ALTER COLUMN "status" DROP DEFAULT;
    CREATE TYPE "SalesOrderStatus_wms" AS ENUM ('DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CLOSED', 'CANCELLED', 'RETURNED');
    ALTER TABLE "SalesOrder" ALTER COLUMN "status" TYPE "SalesOrderStatus_wms" USING "status"::text::"SalesOrderStatus_wms";
    DROP TYPE "SalesOrderStatus";
    ALTER TYPE "SalesOrderStatus_wms" RENAME TO "SalesOrderStatus";
    ALTER TABLE "SalesOrder" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

    CREATE TYPE "StockMovementType_wms" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ALLOCATION', 'DEALLOCATION', 'PICK', 'PUTAWAY', 'SHIPMENT', 'RETURN', 'REVERSAL');
    ALTER TABLE "StockMovement" ALTER COLUMN "type" TYPE "StockMovementType_wms" USING "type"::text::"StockMovementType_wms";
    DROP TYPE "StockMovementType";
    ALTER TYPE "StockMovementType_wms" RENAME TO "StockMovementType";
  END IF;
END $$;

-- Normalize any duplicate nullable identities, then preserve legacy movement
-- rows and add compensating entries so the physical ledger equals the balance.
DO $$
DECLARE
  item_record RECORD;
  balance_record RECORD;
  remaining_qty DECIMAL(18,6);
  allocation_qty DECIMAL(18,6);
BEGIN
  CREATE TEMP TABLE migration_balance_merge ON COMMIT DROP AS
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "organizationId", "warehouseId", "binId", "productId", "variantId", "inventoryStatus", "lotNumber", "serialNumber"
      ORDER BY "createdAt", "id"
    ) AS survivor_id,
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId", "warehouseId", "binId", "productId", "variantId", "inventoryStatus", "lotNumber", "serialNumber"
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM "StockLevel";

  UPDATE "StockMovement" movement
  SET "stockLevelId" = merge.survivor_id
  FROM migration_balance_merge merge
  WHERE movement."stockLevelId" = merge."id" AND merge.row_number > 1;

  UPDATE "StockLevel" survivor
  SET
    "onHand" = totals.on_hand,
    "allocated" = 0,
    "hold" = totals.hold_qty,
    "available" = totals.on_hand - totals.hold_qty,
    "version" = survivor."version" + 1
  FROM (
    SELECT merge.survivor_id, SUM(balance."onHand") AS on_hand, SUM(balance."hold") AS hold_qty
    FROM migration_balance_merge merge
    JOIN "StockLevel" balance ON balance."id" = merge."id"
    GROUP BY merge.survivor_id
  ) totals
  WHERE survivor."id" = totals.survivor_id;

  DELETE FROM "StockLevel" balance
  USING migration_balance_merge merge
  WHERE balance."id" = merge."id" AND merge.row_number > 1;

  INSERT INTO "StockMovement" (
    "id", "organizationId", "type", "productId", "variantId", "warehouseId", "stockLevelId",
    "quantity", "onHandDelta", "allocatedDelta", "holdDelta",
    "beforeOnHand", "afterOnHand", "beforeAllocated", "afterAllocated",
    "beforeHold", "afterHold", "beforeAvailable", "afterAvailable",
    "sourceDocumentType", "sourceDocumentId", "reference", "idempotencyKey", "reason", "createdById", "createdAt"
  )
  SELECT
    'migration-balance-' || md5(balance."id"),
    balance."organizationId", 'ADJUSTMENT', balance."productId", balance."variantId",
    balance."warehouseId", balance."id",
    GREATEST(ABS(balance."onHand" - COALESCE(ledger.on_hand, 0)), 0.000001),
    balance."onHand" - COALESCE(ledger.on_hand, 0), 0,
    balance."hold" - COALESCE(ledger.hold_qty, 0),
    COALESCE(ledger.on_hand, 0), balance."onHand", 0, 0,
    COALESCE(ledger.hold_qty, 0), balance."hold",
    COALESCE(ledger.on_hand, 0) - COALESCE(ledger.hold_qty, 0), balance."available",
    'MIGRATION', balance."id", 'POSTGRESQL-WMS-BASELINE',
    'MIGRATION:BALANCE:' || balance."id",
    'Compensating opening balance; legacy ledger rows remain immutable', actor."id", CURRENT_TIMESTAMP
  FROM "StockLevel" balance
  LEFT JOIN (
    SELECT "stockLevelId", SUM("onHandDelta") AS on_hand, SUM("holdDelta") AS hold_qty
    FROM "StockMovement" WHERE "stockLevelId" IS NOT NULL GROUP BY "stockLevelId"
  ) ledger ON ledger."stockLevelId" = balance."id"
  JOIN LATERAL (
    SELECT "id" FROM "User" WHERE "organizationId" = balance."organizationId" ORDER BY "createdAt" LIMIT 1
  ) actor ON true
  WHERE balance."onHand" <> COALESCE(ledger.on_hand, 0)
     OR balance."hold" <> COALESCE(ledger.hold_qty, 0);

  -- Rebuild reservations only for open, unshipped orders. DRAFT and CANCELLED
  -- legacy reservations are deliberately released.
  FOR item_record IN
    SELECT item.*, orders."organizationId", orders."soNumber", orders."createdById", orders."status"
    FROM "SalesOrderItem" item
    JOIN "SalesOrder" orders ON orders."id" = item."salesOrderId"
    WHERE orders."status"::text IN ('CONFIRMED', 'PICKING', 'PACKED')
    ORDER BY orders."createdAt", item."createdAt", item."id"
  LOOP
    remaining_qty := item_record."quantity";
    FOR balance_record IN
      SELECT * FROM "StockLevel"
      WHERE "organizationId" = item_record."organizationId"
        AND "productId" = item_record."productId"
        AND "variantId" IS NOT DISTINCT FROM item_record."variantId"
        AND "inventoryStatus" = 'AVAILABLE'
        AND "available" > 0
      ORDER BY "warehouseId", "binId" NULLS FIRST, "createdAt", "id"
      FOR UPDATE
    LOOP
      EXIT WHEN remaining_qty <= 0;
      allocation_qty := LEAST(remaining_qty, balance_record."available");
      INSERT INTO "InventoryAllocation" (
        "id", "organizationId", "salesOrderId", "salesOrderItemId", "stockLevelId",
        "quantity", "status", "idempotencyKey", "createdById", "createdAt"
      ) VALUES (
        'migration-allocation-' || md5(item_record."id" || ':' || balance_record."id"),
        item_record."organizationId", item_record."salesOrderId", item_record."id", balance_record."id",
        allocation_qty, 'ACTIVE',
        'MIGRATION:SO:' || item_record."salesOrderId" || ':ITEM:' || item_record."id" || ':BALANCE:' || balance_record."id",
        item_record."createdById", CURRENT_TIMESTAMP
      );
      INSERT INTO "StockMovement" (
        "id", "organizationId", "type", "productId", "variantId", "warehouseId", "stockLevelId",
        "quantity", "onHandDelta", "allocatedDelta", "holdDelta",
        "beforeOnHand", "afterOnHand", "beforeAllocated", "afterAllocated",
        "beforeHold", "afterHold", "beforeAvailable", "afterAvailable",
        "sourceDocumentType", "sourceDocumentId", "reference", "idempotencyKey", "correlationId",
        "reason", "createdById", "createdAt"
      ) VALUES (
        'migration-allocation-movement-' || md5(item_record."id" || ':' || balance_record."id"),
        item_record."organizationId", 'ALLOCATION', item_record."productId", item_record."variantId",
        balance_record."warehouseId", balance_record."id", allocation_qty, 0, allocation_qty, 0,
        balance_record."onHand", balance_record."onHand",
        balance_record."allocated", balance_record."allocated" + allocation_qty,
        balance_record."hold", balance_record."hold",
        balance_record."available", balance_record."available" - allocation_qty,
        'SALES_ORDER', item_record."salesOrderId", item_record."soNumber",
        'MIGRATION:SO:' || item_record."salesOrderId" || ':ALLOCATE:' || item_record."id" || ':' || balance_record."id",
        'SO:' || item_record."salesOrderId", 'Reconstructed from legacy open sales order',
        item_record."createdById", CURRENT_TIMESTAMP
      );
      UPDATE "StockLevel"
      SET "allocated" = "allocated" + allocation_qty,
          "available" = "available" - allocation_qty,
          "version" = "version" + 1
      WHERE "id" = balance_record."id";
      remaining_qty := remaining_qty - allocation_qty;
    END LOOP;
    IF remaining_qty > 0 THEN
      RAISE EXCEPTION 'Cannot reconstruct allocation for sales order %, item %; shortage %',
        item_record."soNumber", item_record."id", remaining_qty;
    END IF;
  END LOOP;

  UPDATE "SalesOrder"
  SET "confirmedAt" = COALESCE("confirmedAt", "updatedAt"),
      "allocatedAt" = COALESCE("allocatedAt", CURRENT_TIMESTAMP),
      "status" = CASE WHEN "status"::text = 'CONFIRMED' THEN 'ALLOCATED'::"SalesOrderStatus" ELSE "status" END
  WHERE "status"::text IN ('CONFIRMED', 'PICKING', 'PACKED');
END $$;

-- Backfill authoritative memberships and system roles without changing the
-- transitional User.role value carried by existing access tokens.
INSERT INTO "Role" ("id", "organizationId", "name", "slug", "description", "isSystem", "createdAt", "updatedAt")
SELECT 'system-role-' || md5(org."id" || ':' || role_data.slug), org."id", role_data.name, role_data.slug,
       'Built-in action permission role', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Organization" org
CROSS JOIN (VALUES
  ('OWNER', 'owner'), ('ADMIN', 'admin'), ('INVENTORY_MANAGER', 'inventory_manager'),
  ('WAREHOUSE_STAFF', 'warehouse_staff'), ('CASHIER', 'cashier'), ('VIEWER', 'viewer')
) AS role_data(name, slug)
ON CONFLICT ("organizationId", "slug") DO UPDATE SET "isSystem" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "joinedAt")
SELECT 'migration-member-' || md5(user_row."organizationId" || ':' || user_row."id"),
       user_row."organizationId", user_row."id", user_row."role", CURRENT_TIMESTAMP
FROM "User" user_row
ON CONFLICT ("organizationId", "userId") DO NOTHING;

UPDATE "OrganizationMember" member
SET "roleId" = role_row."id"
FROM "Role" role_row
WHERE role_row."organizationId" = member."organizationId"
  AND role_row."slug" = lower(member."role"::text)
  AND member."roleId" IS NULL;

INSERT INTO "RolePermission" ("id", "roleId", "permission")
SELECT 'system-permission-' || md5(role_row."id" || ':' || permission_map.permission),
       role_row."id", permission_map.permission
FROM "Role" role_row
JOIN (VALUES
  ('OWNER', '*'), ('ADMIN', '*'),
  ('INVENTORY_MANAGER', 'product.read'), ('INVENTORY_MANAGER', 'product.create'), ('INVENTORY_MANAGER', 'product.update'), ('INVENTORY_MANAGER', 'product.archive'),
  ('INVENTORY_MANAGER', 'inventory.read'), ('INVENTORY_MANAGER', 'inventory.adjust.request'), ('INVENTORY_MANAGER', 'inventory.adjust.approve'),
  ('INVENTORY_MANAGER', 'inventory.transfer.create'), ('INVENTORY_MANAGER', 'inventory.transfer.dispatch'), ('INVENTORY_MANAGER', 'inventory.transfer.receive'), ('INVENTORY_MANAGER', 'inventory.reconcile'),
  ('INVENTORY_MANAGER', 'po.read'), ('INVENTORY_MANAGER', 'po.create'), ('INVENTORY_MANAGER', 'po.submit'), ('INVENTORY_MANAGER', 'po.approve'), ('INVENTORY_MANAGER', 'po.send'), ('INVENTORY_MANAGER', 'po.cancel'),
  ('INVENTORY_MANAGER', 'receipt.create'), ('INVENTORY_MANAGER', 'receipt.post'), ('INVENTORY_MANAGER', 'receipt.reverse'),
  ('INVENTORY_MANAGER', 'so.read'), ('INVENTORY_MANAGER', 'so.create'), ('INVENTORY_MANAGER', 'so.confirm'), ('INVENTORY_MANAGER', 'so.cancel'),
  ('INVENTORY_MANAGER', 'pick.execute'), ('INVENTORY_MANAGER', 'pack.execute'), ('INVENTORY_MANAGER', 'shipment.post'),
  ('INVENTORY_MANAGER', 'cycle_count.create'), ('INVENTORY_MANAGER', 'cycle_count.execute'), ('INVENTORY_MANAGER', 'cycle_count.approve'),
  ('WAREHOUSE_STAFF', 'product.read'), ('WAREHOUSE_STAFF', 'inventory.read'), ('WAREHOUSE_STAFF', 'inventory.adjust.request'),
  ('WAREHOUSE_STAFF', 'inventory.transfer.create'), ('WAREHOUSE_STAFF', 'inventory.transfer.dispatch'), ('WAREHOUSE_STAFF', 'inventory.transfer.receive'),
  ('WAREHOUSE_STAFF', 'po.read'), ('WAREHOUSE_STAFF', 'receipt.create'), ('WAREHOUSE_STAFF', 'receipt.post'), ('WAREHOUSE_STAFF', 'so.read'),
  ('WAREHOUSE_STAFF', 'pick.execute'), ('WAREHOUSE_STAFF', 'pack.execute'),
  ('CASHIER', 'product.read'), ('CASHIER', 'inventory.read'), ('CASHIER', 'so.read'), ('CASHIER', 'so.create'),
  ('VIEWER', 'product.read'), ('VIEWER', 'inventory.read'), ('VIEWER', 'po.read'), ('VIEWER', 'so.read')
) AS permission_map(role_name, permission) ON permission_map.role_name = upper(role_row."slug")
WHERE role_row."isSystem" = true
ON CONFLICT ("roleId", "permission") DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "StockLevel_inventory_identity_key"
  ON "StockLevel"("organizationId", "warehouseId", "binId", "productId", "variantId", "inventoryStatus", "lotNumber", "serialNumber") NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS "StockLevel_organizationId_warehouseId_productId_variantId_binId_inventoryStatus_idx"
  ON "StockLevel"("organizationId", "warehouseId", "productId", "variantId", "binId", "inventoryStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "StockMovement_organizationId_idempotencyKey_key" ON "StockMovement"("organizationId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "StockMovement_sourceDocumentType_sourceDocumentId_idx" ON "StockMovement"("sourceDocumentType", "sourceDocumentId");
CREATE INDEX IF NOT EXISTS "StockMovement_correlationId_idx" ON "StockMovement"("correlationId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_roleId_idx" ON "OrganizationMember"("roleId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_roleId_fkey') THEN
    ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_reversalOfId_fkey') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reversalOfId_fkey"
      FOREIGN KEY ("reversalOfId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockLevel_non_negative_check') THEN
    ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_non_negative_check"
      CHECK ("onHand" >= 0 AND "allocated" >= 0 AND "hold" >= 0 AND "available" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockLevel_available_invariant_check') THEN
    ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_available_invariant_check"
      CHECK ("available" = "onHand" - "allocated" - "hold");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_positive_quantity_check') THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_positive_quantity_check" CHECK ("quantity" > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Posted stock movements are immutable; post a reversal instead';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "StockMovement_immutable" ON "StockMovement";
CREATE TRIGGER "StockMovement_immutable"
BEFORE UPDATE OR DELETE ON "StockMovement"
FOR EACH ROW EXECUTE FUNCTION prevent_stock_movement_mutation();
