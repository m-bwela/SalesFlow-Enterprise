/*
  Warnings:

  - You are about to drop the column `joinedAt` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,organizationId]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('ADMIN', 'RSM', 'GT_TSM', 'MT_TSM', 'MTSR', 'ASR');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'REGION', 'TERRITORY', 'DISTRIBUTOR', 'WAREHOUSE');

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_roleId_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_organizationId_fkey";

-- DropIndex
DROP INDEX "memberships_organizationId_status_idx";

-- DropIndex
DROP INDEX "memberships_organizationId_userId_key";

-- DropIndex
DROP INDEX "organizations_slug_key";

-- DropIndex
DROP INDEX "organizations_status_idx";

-- DropIndex
DROP INDEX "permissions_key_key";

-- DropIndex
DROP INDEX "roles_organizationId_idx";

-- DropIndex
DROP INDEX "roles_organizationId_name_key";

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "joinedAt",
DROP COLUMN "roleId",
DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "slug",
DROP COLUMN "status",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "key",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "organizationId",
ADD COLUMN     "code" "RoleCode" NOT NULL,
ALTER COLUMN "isSystem" SET DEFAULT true;

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributors" (
    "id" UUID NOT NULL,
    "territoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "distributorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scopeType" "ScopeType" NOT NULL,
    "regionId" UUID,
    "territoryId" UUID,
    "distributorId" UUID,
    "warehouseId" UUID,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE INDEX "regions_organizationId_idx" ON "regions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "regions_organizationId_code_key" ON "regions"("organizationId", "code");

-- CreateIndex
CREATE INDEX "territories_regionId_idx" ON "territories"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "territories_regionId_code_key" ON "territories"("regionId", "code");

-- CreateIndex
CREATE INDEX "distributors_territoryId_idx" ON "distributors"("territoryId");

-- CreateIndex
CREATE UNIQUE INDEX "distributors_territoryId_code_key" ON "distributors"("territoryId", "code");

-- CreateIndex
CREATE INDEX "warehouses_distributorId_idx" ON "warehouses"("distributorId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_distributorId_code_key" ON "warehouses"("distributorId", "code");

-- CreateIndex
CREATE INDEX "membership_roles_roleId_idx" ON "membership_roles"("roleId");

-- CreateIndex
CREATE INDEX "membership_roles_regionId_idx" ON "membership_roles"("regionId");

-- CreateIndex
CREATE INDEX "membership_roles_territoryId_idx" ON "membership_roles"("territoryId");

-- CreateIndex
CREATE INDEX "membership_roles_distributorId_idx" ON "membership_roles"("distributorId");

-- CreateIndex
CREATE INDEX "membership_roles_warehouseId_idx" ON "membership_roles"("warehouseId");

-- CreateIndex
CREATE INDEX "membership_roles_isActive_startsAt_endsAt_idx" ON "membership_roles"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "membership_roles_membershipId_roleId_key" ON "membership_roles"("membershipId", "roleId");

-- CreateIndex
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
