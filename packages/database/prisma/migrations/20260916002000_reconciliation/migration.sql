CREATE TYPE "ReconciliationRunStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DiscrepancyResolution" AS ENUM ('ADJUST_STORED', 'ADJUST_LEDGER', 'INVESTIGATE', 'IGNORE');

CREATE TABLE "ReconciliationRun" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "status" "ReconciliationRunStatus" NOT NULL DEFAULT 'PENDING',
  "startedById" TEXT NOT NULL,
  "completedById" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "totalBalances" INTEGER NOT NULL DEFAULT 0,
  "discrepancyCount" INTEGER NOT NULL DEFAULT 0,
  "resolvedCount" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReconciliationRun_organizationId_idx" ON "ReconciliationRun"("organizationId");
CREATE INDEX "ReconciliationRun_warehouseId_idx" ON "ReconciliationRun"("warehouseId");
CREATE INDEX "ReconciliationRun_status_idx" ON "ReconciliationRun"("status");

ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_startedById_fkey"
  FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "DiscrepancyResolution" AS ENUM ('ADJUST_STORED', 'ADJUST_LEDGER', 'INVESTIGATE', 'IGNORE');

CREATE TABLE "ReconciliationDiscrepancy" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "balanceId" TEXT NOT NULL,
  "storedOnHand" DECIMAL(18,6) NOT NULL,
  "storedAllocated" DECIMAL(18,6) NOT NULL,
  "storedHold" DECIMAL(18,6) NOT NULL,
  "storedAvailable" DECIMAL(18,6) NOT NULL,
  "ledgerOnHand" DECIMAL(18,6) NOT NULL,
  "ledgerAllocated" DECIMAL(18,6) NOT NULL,
  "ledgerHold" DECIMAL(18,6) NOT NULL,
  "ledgerAvailable" DECIMAL(18,6) NOT NULL,
  "resolution" "DiscrepancyResolution",
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "adjustmentId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReconciliationDiscrepancy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReconciliationDiscrepancy_runId_idx" ON "ReconciliationDiscrepancy"("runId");
CREATE INDEX "ReconciliationDiscrepancy_balanceId_idx" ON "ReconciliationDiscrepancy"("balanceId");
CREATE INDEX "ReconciliationDiscrepancy_resolution_idx" ON "ReconciliationDiscrepancy"("resolution");

ALTER TABLE "ReconciliationDiscrepancy" ADD CONSTRAINT "ReconciliationDiscrepancy_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "ReconciliationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReconciliationDiscrepancy" ADD CONSTRAINT "ReconciliationDiscrepancy_balanceId_fkey"
  FOREIGN KEY ("balanceId") REFERENCES "StockLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReconciliationDiscrepancy" ADD CONSTRAINT "ReconciliationDiscrepancy_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;