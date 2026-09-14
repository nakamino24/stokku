-- Add explicit warehouse scope to organization memberships. Existing members are
-- initially assigned to every warehouse so this additive migration preserves
-- current access until administrators narrow assignments deliberately.

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_id_key"
  ON "OrganizationMember" ("organizationId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_organizationId_id_key"
  ON "Warehouse" ("organizationId", "id");

CREATE TABLE "OrganizationMemberWarehouse" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "organizationMemberId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMemberWarehouse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationMemberWarehouse_member_fkey"
    FOREIGN KEY ("organizationId", "organizationMemberId")
    REFERENCES "OrganizationMember" ("organizationId", "id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrganizationMemberWarehouse_warehouse_fkey"
    FOREIGN KEY ("organizationId", "warehouseId")
    REFERENCES "Warehouse" ("organizationId", "id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OrganizationMemberWarehouse_organizationId_organizationMemberId_warehouseId_key"
  ON "OrganizationMemberWarehouse" ("organizationId", "organizationMemberId", "warehouseId");
CREATE INDEX "OrganizationMemberWarehouse_organizationId_warehouseId_idx"
  ON "OrganizationMemberWarehouse" ("organizationId", "warehouseId");
CREATE INDEX "OrganizationMemberWarehouse_organizationMemberId_idx"
  ON "OrganizationMemberWarehouse" ("organizationMemberId");

INSERT INTO "OrganizationMemberWarehouse" ("id", "organizationId", "organizationMemberId", "warehouseId")
SELECT md5(member."id" || warehouse."id"), member."organizationId", member."id", warehouse."id"
FROM "OrganizationMember" member
JOIN "Warehouse" warehouse ON warehouse."organizationId" = member."organizationId"
ON CONFLICT ("organizationId", "organizationMemberId", "warehouseId") DO NOTHING;
