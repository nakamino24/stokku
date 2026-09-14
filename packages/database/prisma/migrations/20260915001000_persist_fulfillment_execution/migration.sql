CREATE TYPE "FulfillmentTaskStatus" AS ENUM ('READY', 'CLAIMED', 'PICKED', 'PACKING_CLAIMED', 'PACKED', 'SHORTED', 'EXCEPTION');

ALTER TABLE "InventoryAllocation"
  ADD COLUMN "executionStatus" "FulfillmentTaskStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN "claimedById" TEXT,
  ADD COLUMN "claimedAt" TIMESTAMP(3),
  ADD COLUMN "pickedQty" DECIMAL(18,6),
  ADD COLUMN "packedQty" DECIMAL(18,6),
  ADD COLUMN "shortQty" DECIMAL(18,6),
  ADD COLUMN "exceptionReason" TEXT,
  ADD COLUMN "pickedAt" TIMESTAMP(3),
  ADD COLUMN "packedAt" TIMESTAMP(3);

CREATE INDEX "InventoryAllocation_organizationId_executionStatus_idx"
  ON "InventoryAllocation"("organizationId", "executionStatus");

ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "InventoryAllocation_claimedById_fkey"
  FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
