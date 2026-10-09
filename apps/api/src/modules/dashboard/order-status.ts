import type { SalesOrderStatus } from "@prisma/client";

// Statuses that represent a confirmed, real sale. PENDING and PENDING_TSM_REVIEW orders haven't
// been reviewed yet, and CANCELLED never became a sale — none of these count toward revenue or
// order KPIs until the order has been approved (or moved further along the fulfillment pipeline):
// PENDING -> PENDING_TSM_REVIEW -> APPROVED -> CONFIRMED -> RECEIVED -> DELIVERED.
export const REVENUE_COUNTED_STATUSES: SalesOrderStatus[] = ["APPROVED", "CONFIRMED", "RECEIVED", "DELIVERED"];

export const ALL_ORDER_STATUSES: SalesOrderStatus[] = [
    "PENDING",
    "PENDING_TSM_REVIEW",
    "APPROVED",
    "CONFIRMED",
    "RECEIVED",
    "DELIVERED",
    "CANCELLED",
];
