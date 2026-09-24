import { prisma } from "@salesflow/database";

import type { DashboardFilters } from "./dashboard.types.js";

export async function getAdminDashboard(filters: DashboardFilters) {
   const now = new Date();

   // Consider a session online when:
   // - it has not been revoked
   //- it has not expired
   // - it has been active within the last 5 minutes
   const onlineSince = new Date(
    now.getTime() - 5 * 60 * 1000,
   );

   const [userCount, onlineSessions] = await Promise.all([
    prisma.user.count({
        where: {
            status: "ACTIVE",
        },
    }),

    prisma.session.findMany({
        where: {
            revokedAt: null,
            expiresAt: {
                gt: now,
            },
            lastSeenAt: {
                gte: onlineSince,
            },
        },
        select: {
            userId: true,
        },
        distinct: ["userId"],
    }),
   ]);

   return {
    users: userCount,

    onlineUsers: onlineSessions.length,

    // Sales, outlets and orders will be connected
    // when those domains are implemented
    outlets: 0,

    sales: {
        amount: 0,
        currency: "KES",
    },

    orders: 0,
   };
}