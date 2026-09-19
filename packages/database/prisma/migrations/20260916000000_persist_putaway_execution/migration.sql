CREATE TYPE "PutawayTaskStatus" AS ENUM ('READY', 'CLAIMED', 'COMPLETED', 'EXCEPTION');

ALTER TABLE "GoodsReceiptLine"
  ADD COLUMN "taskStatus" "PutawayTaskStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN "claimedById" TEXT,
  ADD COLUMN "claimedAt" TIMESTAMP(3),
  ADD COLUMN "destinationBinId" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "exceptionReason" TEXT;

CREATE INDEX "GoodsReceiptLine_taskStatus_idx" ON "GoodsReceiptLine"("taskStatus");

ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_claimedById_fkey"
  FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_destinationBinId_fkey"
  FOREIGN KEY ("destinationBinId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
