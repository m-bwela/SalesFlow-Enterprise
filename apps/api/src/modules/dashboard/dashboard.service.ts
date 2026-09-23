import { prisma } from "@salesflow/database";

export async function getAdminDashboard() {
    const [
        userCount,
        outletCount,
        orderCount,
    ] = await Promise.all([
        prisma.user.count({
            where: {
                isActive: true,
            },
        }),

        prisma.outlet.count(),

        prisma.salesOrder.count(),
    ]);

    return {
        users: userCount,
        onlineUsers: 0,
        outlets: outletCount,
        sales: {
            amount: 0,
            currency: "KES"
        },
        orders: orderCount,
    };
}