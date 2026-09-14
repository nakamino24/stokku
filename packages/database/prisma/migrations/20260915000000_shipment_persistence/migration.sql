CREATE TYPE "ShipmentStatus" AS ENUM ('POSTED', 'VOIDED');

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'POSTED',
  "trackingNumber" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "note" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "postedById" TEXT NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,

  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Shipment_organizationId_salesOrderId_key" ON "Shipment"("organizationId", "salesOrderId");
CREATE UNIQUE INDEX "Shipment_salesOrderId_key" ON "Shipment"("salesOrderId");
CREATE UNIQUE INDEX "Shipment_organizationId_idempotencyKey_key" ON "Shipment"("organizationId", "idempotencyKey");
CREATE INDEX "Shipment_organizationId_status_idx" ON "Shipment"("organizationId", "status");
CREATE INDEX "Shipment_salesOrderId_idx" ON "Shipment"("salesOrderId");

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_postedById_fkey"
  FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
