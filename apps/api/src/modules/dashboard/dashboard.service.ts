import { prisma } from "@salesflow/database";

import type { DashboardFilters } from "./dashboard.types.js";

const PERIOD_DURATIONS: Record<DashboardFilters["period"], number> = {
    LIVE: 5 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
    "6M": 180 * 24 * 60 * 60 * 1000,
    YTD: 0,
    "1Y": 365 * 24 * 60 * 60 * 1000,
    ALL: 0,
};

function getPeriodStart(period: DashboardFilters["period"], now: Date) {
    if (period === "ALL") {
        return new Date(0);
    }

    if (period === "YTD") {
        return new Date(now.getFullYear(), 0, 1);
    }

    return new Date(now.getTime() - PERIOD_DURATIONS[period]);
}

function countByTimeBucket(records: { createdAt: Date }[], start: Date, end: Date) {
    const bucketCount = 12;
    const periodLength = Math.max(end.getTime() - start.getTime(), 1);
    const buckets = Array.from({ length: bucketCount }, () => 0);

    for (const record of records) {
        const position = (record.createdAt.getTime() - start.getTime()) / periodLength;
        const index = Math.min(Math.floor(position * bucketCount), bucketCount - 1);

        if (index >= 0) {
            buckets[index] += 1;
        }
    }

    return buckets;
}

function getBucketIndex(date: Date, start: Date, end: Date, bucketCount: number) {
    const position = (date.getTime() - start.getTime()) / Math.max(end.getTime() - start.getTime(), 1);
    return Math.min(Math.floor(position * bucketCount), bucketCount - 1);
}

export async function getAdminDashboard(filters: DashboardFilters) {
    const now = new Date();
    const periodStart = getPeriodStart(filters.period, now);
    const onlineSince = new Date(now.getTime() - 5 * 60 * 1000);
    const createdAtFilter = { gte: periodStart, lte: now };

    const [
        users,
        onlineSessions,
        organizations,
        regions,
        territories,
        distributors,
        warehouses,
        memberships,
        newUsers,
        newOrganizations,
        activeOutlets,
        activeProducts,
        salesOrders,
    ] = await Promise.all([
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.session.findMany({
            where: {
                revokedAt: null,
                expiresAt: { gt: now },
                lastSeenAt: { gte: onlineSince },
            },
            select: { userId: true },
            distinct: ["userId"],
        }),
        prisma.organization.count({ where: { isActive: true } }),
        prisma.region.count({ where: { isActive: true } }),
        prisma.territory.count({ where: { isActive: true } }),
        prisma.distributor.count({ where: { isActive: true } }),
        prisma.warehouse.count({ where: { isActive: true } }),
        prisma.membership.count({ where: { isActive: true } }),
        prisma.user.findMany({
            where: { createdAt: createdAtFilter },
            select: { createdAt: true },
        }),
        prisma.organization.findMany({
            where: { createdAt: createdAtFilter },
            select: { createdAt: true },
        }),
        prisma.outlet.count({
            where: {
                isActive: true,
                ...(filters.distributorId ? { distributorId: filters.distributorId } : {}),
                ...(filters.territoryId || filters.regionId ? {
                    distributor: {
                        ...(filters.territoryId ? { territoryId: filters.territoryId } : {}),
                        ...(filters.regionId ? { territory: { regionId: filters.regionId } } : {}),
                    },
                } : {}),
            },
        }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.salesOrder.findMany({
            where: {
                orderDate: createdAtFilter,
                status: { not: "DRAFT" },
                currency: "KES",
                ...(filters.distributorId ? { distributorId: filters.distributorId } : {}),
                ...(filters.territoryId || filters.regionId ? {
                    distributor: {
                        ...(filters.territoryId ? { territoryId: filters.territoryId } : {}),
                        ...(filters.regionId ? { territory: { regionId: filters.regionId } } : {}),
                    },
                } : {}),
                ...(filters.asrId ? { createdById: filters.asrId } : {}),
            },
            select: {
                orderDate: true,
                status: true,
                currency: true,
                items: {
                    select: {
                        productId: true,
                        productName: true,
                        productSku: true,
                        quantity: true,
                        unitPrice: true,
                        product: { select: { category: true } },
                    },
                },
            },
        }),
    ]);

    const bucketCount = 12;
    const revenueTrend = Array.from({ length: bucketCount }, () => 0);
    const orderTrend = Array.from({ length: bucketCount }, () => 0);
    const productTotals = new Map<string, { name: string; category: string | null; quantity: number; revenue: number }>();
    let revenue = 0;
    let orderCount = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let itemsSold = 0;

    for (const order of salesOrders) {
        if (order.status === "CANCELLED") {
            cancelledOrders += 1;
            continue;
        }

        if (order.status === "DRAFT") {
            continue;
        }

        orderCount += 1;
        if (order.status === "DELIVERED") {
            deliveredOrders += 1;
        }

        const bucketIndex = getBucketIndex(order.orderDate, periodStart, now, bucketCount);
        orderTrend[bucketIndex] += 1;

        for (const item of order.items) {
            const quantity = Number(item.quantity);
            const lineRevenue = quantity * Number(item.unitPrice);
            itemsSold += quantity;

            if (order.currency === "KES") {
                revenue += lineRevenue;
                revenueTrend[bucketIndex] += lineRevenue;
            }

            const existing = productTotals.get(item.productId) ?? {
                name: item.productName,
                category: item.product.category,
                quantity: 0,
                revenue: 0,
            };
            existing.quantity += quantity;
            if (order.currency === "KES") {
                existing.revenue += lineRevenue;
            }
            productTotals.set(item.productId, existing);
        }
    }

    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    const deliveryRate = orderCount > 0 ? (deliveredOrders / orderCount) * 100 : 0;

    return {
        users,
        onlineUsers: onlineSessions.length,
        organizations,
        regions,
        territories,
        distributors,
        warehouses,
        memberships,
        newUsers: newUsers.length,
        newOrganizations: newOrganizations.length,
        userTrend: countByTimeBucket(newUsers, periodStart, now),
        organizationTrend: countByTimeBucket(newOrganizations, periodStart, now),
        revenue,
        currency: "KES",
        orders: orderCount,
        averageOrderValue,
        activeOutlets,
        activeProducts,
        itemsSold,
        deliveredOrders,
        cancelledOrders,
        deliveryRate,
        revenueTrend,
        orderTrend,
        productsByRevenue: [...productTotals.entries()]
            .map(([productId, product]) => ({ productId, ...product }))
            .sort((left, right) => right.revenue - left.revenue)
            .slice(0, 5),
    };
}