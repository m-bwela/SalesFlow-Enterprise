-- Replace the SalesOrderStatus lifecycle with the 7-status workflow used by Order Analytics:
-- PENDING -> PENDING_TSM_REVIEW -> APPROVED -> CONFIRMED -> RECEIVED -> DELIVERED, with CANCELLED
-- reachable from any non-delivered state. This is the order's physical fulfillment lifecycle,
-- distinct from the separate OrderApprovalStatus (Pending/Approved/Rejected) "Invoice" workflow
-- used for Depot orders, which is untouched by this migration.

CREATE TYPE "SalesOrderStatus_new" AS ENUM (
    'PENDING',
    'PENDING_TSM_REVIEW',
    'APPROVED',
    'CONFIRMED',
    'RECEIVED',
    'DELIVERED',
    'CANCELLED'
);

-- Map every existing row onto the closest new status before switching the column's type.
ALTER TABLE "sales_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sales_orders" ALTER COLUMN "status" TYPE "SalesOrderStatus_new" USING (
    CASE "status"::text
        WHEN 'DRAFT' THEN 'PENDING'
        WHEN 'PROCESSING' THEN 'APPROVED'
        WHEN 'SHIPPED' THEN 'RECEIVED'
        ELSE "status"::text
    END
)::"SalesOrderStatus_new";

DROP TYPE "SalesOrderStatus";
ALTER TYPE "SalesOrderStatus_new" RENAME TO "SalesOrderStatus";

ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
