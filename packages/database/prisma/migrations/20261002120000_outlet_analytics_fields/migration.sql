CREATE TYPE "OutletType" AS ENUM ('SHOP', 'RESTAURANT', 'KIOSK', 'BAR', 'OTHER');

ALTER TABLE "outlets"
ADD COLUMN "type" "OutletType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "coolerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "createdById" UUID;

ALTER TABLE "sales_orders"
ADD COLUMN "paymentMethod" TEXT;

CREATE INDEX "outlets_type_idx" ON "outlets"("type");
CREATE INDEX "sales_orders_paymentMethod_orderDate_idx" ON "sales_orders"("paymentMethod", "orderDate");

ALTER TABLE "outlets" ADD CONSTRAINT "outlets_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;