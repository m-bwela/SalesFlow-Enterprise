-- Denormalize organizationId onto territories (same pattern as outlets.organizationId), and add
-- a nullable short code used to prefix outlet codes.
ALTER TABLE "territories" ADD COLUMN "organizationId" UUID;
ALTER TABLE "territories" ADD COLUMN "shortCode" TEXT;

UPDATE "territories" t
SET "organizationId" = r."organizationId"
FROM "regions" r
WHERE r."id" = t."regionId";

ALTER TABLE "territories" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "territories" ADD CONSTRAINT "territories_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "territories_organizationId_idx" ON "territories"("organizationId");
CREATE UNIQUE INDEX "territories_organizationId_shortCode_key" ON "territories"("organizationId", "shortCode");
