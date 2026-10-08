-- New enum for the invoice approval workflow (MT_TSM approves/rejects MTSR/HORECA orders).
CREATE TYPE "OrderApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Depot: a company-owned branch holding bulk stock. Can supply distributors or sell straight to
-- the field (MTSR/HORECA reps), bypassing distributors entirely.
CREATE TABLE "depots" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "regionId" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "depots_organizationId_code_key" ON "depots"("organizationId", "code");
CREATE INDEX "depots_organizationId_idx" ON "depots"("organizationId");
CREATE INDEX "depots_regionId_idx" ON "depots"("regionId");

ALTER TABLE "depots" ADD CONSTRAINT "depots_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "depots" ADD CONSTRAINT "depots_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Outlets: distributor becomes optional, depot becomes a second optional source. Exactly one of
-- the two must be set, enforced at the database level so this can never silently drift.
ALTER TABLE "outlets" ALTER COLUMN "distributorId" DROP NOT NULL;
ALTER TABLE "outlets" ADD COLUMN "depotId" UUID;

CREATE INDEX "outlets_depotId_idx" ON "outlets"("depotId");
ALTER TABLE "outlets" ADD CONSTRAINT "outlets_depotId_fkey"
    FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "outlets" ADD CONSTRAINT "outlets_source_check"
    CHECK (("distributorId" IS NOT NULL) <> ("depotId" IS NOT NULL));

-- Sales orders: same distributor/depot split, plus the new invoice approval workflow.
ALTER TABLE "sales_orders" ALTER COLUMN "distributorId" DROP NOT NULL;
ALTER TABLE "sales_orders" ADD COLUMN "depotId" UUID;
ALTER TABLE "sales_orders" ADD COLUMN "approvalStatus" "OrderApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "sales_orders" ADD COLUMN "reviewedById" UUID;
ALTER TABLE "sales_orders" ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "sales_orders_depotId_orderDate_idx" ON "sales_orders"("depotId", "orderDate");
CREATE INDEX "sales_orders_approvalStatus_idx" ON "sales_orders"("approvalStatus");

ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_depotId_fkey"
    FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_source_check"
    CHECK (("distributorId" IS NOT NULL) <> ("depotId" IS NOT NULL));
