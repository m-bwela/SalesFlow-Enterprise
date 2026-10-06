CREATE TYPE "OrderSupplySource" AS ENUM ('DISTRIBUTOR', 'FACTORY');

ALTER TABLE "sales_orders"
ADD COLUMN "supplySource" "OrderSupplySource" NOT NULL DEFAULT 'DISTRIBUTOR';

CREATE INDEX "sales_orders_supplySource_orderDate_idx" ON "sales_orders"("supplySource", "orderDate");
