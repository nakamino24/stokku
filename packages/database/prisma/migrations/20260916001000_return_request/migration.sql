CREATE TYPE "ReturnDisposition" AS ENUM ('RESTOCK', 'DISCARD', 'REWORK');
CREATE TYPE "ReturnStatus" AS ENUM ('OPEN', 'APPROVED', 'COMPLETED', 'REJECTED');

CREATE TABLE "ReturnRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "quantity" DECIMAL(18,6) NOT NULL,
  "note" TEXT,
  "status" "ReturnStatus" NOT NULL DEFAULT 'OPEN',
  "disposition" "ReturnDisposition",
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "completedById" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnRequest_organizationId_idx" ON "ReturnRequest"("organizationId");
CREATE INDEX "ReturnRequest_salesOrderId_idx" ON "ReturnRequest"("salesOrderId");
CREATE INDEX "ReturnRequest_warehouseId_idx" ON "ReturnRequest"("warehouseId");
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;