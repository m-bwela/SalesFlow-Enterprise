-- CreateEnum
CREATE TYPE "TargetLevel" AS ENUM ('REGION', 'TERRITORY', 'ASR');

-- CreateTable
CREATE TABLE "targets" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "level" "TargetLevel" NOT NULL,
    "entityId" UUID NOT NULL,
    "month" DATE NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "volume" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "newOutlets" INTEGER NOT NULL DEFAULT 0,
    "setById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "targets_organizationId_month_idx" ON "targets"("organizationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "targets_organizationId_level_entityId_month_key" ON "targets"("organizationId", "level", "entityId", "month");

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
