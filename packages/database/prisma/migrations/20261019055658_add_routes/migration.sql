-- CreateEnum
CREATE TYPE "RouteFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "routeId" UUID;

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "territoryId" UUID,
    "agentId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "code" TEXT NOT NULL,
    "frequency" "RouteFrequency" NOT NULL DEFAULT 'WEEKLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routes_organizationId_isActive_idx" ON "routes"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "routes_territoryId_idx" ON "routes"("territoryId");

-- CreateIndex
CREATE INDEX "routes_agentId_idx" ON "routes"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "routes_organizationId_code_key" ON "routes"("organizationId", "code");

-- CreateIndex
CREATE INDEX "outlets_routeId_idx" ON "outlets"("routeId");

-- AddForeignKey
ALTER TABLE "outlets" ADD CONSTRAINT "outlets_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
