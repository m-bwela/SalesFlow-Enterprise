-- AlterTable
ALTER TABLE "products" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "packSize" TEXT;

-- CreateIndex
CREATE INDEX "products_organizationId_brand_idx" ON "products"("organizationId", "brand");

-- CreateIndex
CREATE INDEX "products_organizationId_packSize_idx" ON "products"("organizationId", "packSize");
