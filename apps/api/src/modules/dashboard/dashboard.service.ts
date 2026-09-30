import { prisma } from "@salesflow/database";

import type { AsrDashboardPeriod, DashboardFilters } from "./dashboard.types.js";

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

function getAsrPeriodRange(period: AsrDashboardPeriod, now: Date) {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayMs = 24 * 60 * 60 * 1000;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    switch (period) {
        case "TODAY":
            return { start: todayStart, end: now };
        case "YESTERDAY":
            return { start: new Date(todayStart.getTime() - dayMs), end: todayStart };
        case "THIS_WEEK":
            return { start: weekStart, end: now };
        case "LAST_WEEK":
            return { start: new Date(weekStart.getTime() - 7 * dayMs), end: weekStart };
        case "TWO_WEEKS_BACK":
            return { start: new Date(weekStart.getTime() - 14 * dayMs), end: new Date(weekStart.getTime() - 7 * dayMs) };
        case "THIS_MONTH":
            return { start: monthStart, end: now };
        case "ALL":
            return { start: new Date(0), end: now };
    }
}

export async function getAsrDashboard(period: AsrDashboardPeriod) {
    const now = new Date();
    const { start, end } = getAsrPeriodRange(period, now);
    const activeSince = new Date(now.getTime() - 5 * 60 * 1000);
    const assignments = await prisma.membershipRole.findMany({
        where: {
            role: { code: "ASR" },
            membership: { isActive: true },
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: [{ isActive: "desc" }, { startsAt: "desc" }],
        select: {
            isActive: true,
            regionId: true,
            territoryId: true,
            distributorId: true,
            membership: {
                select: {
                    user: {
                        select: {
                            id: true,
                            displayName: true,
                            email: true,
                            phoneNumber: true,
                            profileImageUrl: true,
                            status: true,
                        },
                    },
                },
            },
        },
    });

    const assignmentByUser = new Map<string, (typeof assignments)[number]>();
    for (const assignment of assignments) {
        const userId = assignment.membership.user.id;
        if (!assignmentByUser.has(userId)) {
            assignmentByUser.set(userId, assignment);
        }
    }

    const userIds = [...assignmentByUser.keys()];
    const regionIds = [...new Set(assignments.flatMap(({ regionId }) => regionId ? [regionId] : []))];
    const territoryIds = [...new Set(assignments.flatMap(({ territoryId }) => territoryId ? [territoryId] : []))];
    const distributorIds = [...new Set(assignments.flatMap(({ distributorId }) => distributorId ? [distributorId] : []))];

    const [onlineSessions, regions, territories, distributors, orders] = await Promise.all([
        userIds.length
            ? prisma.session.findMany({
                where: {
                    userId: { in: userIds },
                    revokedAt: null,
                    expiresAt: { gt: now },
                    lastSeenAt: { gte: activeSince },
                },
                select: { userId: true },
                distinct: ["userId"],
            })
            : Promise.resolve([]),
        regionIds.length ? prisma.region.findMany({ where: { id: { in: regionIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
        territoryIds.length ? prisma.territory.findMany({ where: { id: { in: territoryIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
        distributorIds.length ? prisma.distributor.findMany({ where: { id: { in: distributorIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
        userIds.length
            ? prisma.salesOrder.findMany({
                where: {
                    createdById: { in: userIds },
                    currency: "KES",
                    status: { notIn: ["DRAFT", "CANCELLED"] },
                    orderDate: { gte: start, lt: end },
                },
                select: {
                    createdById: true,
                    orderDate: true,
                    items: {
                        select: {
                            quantity: true,
                            unitPrice: true,
                            product: { select: { unitOfMeasure: true } },
                        },
                    },
                },
            })
            : Promise.resolve([]),
    ]);

    const regionNames = new Map(regions.map(({ id, name }) => [id, name]));
    const territoryNames = new Map(territories.map(({ id, name }) => [id, name]));
    const distributorNames = new Map(distributors.map(({ id, name }) => [id, name]));
    const onlineUserIds = new Set(onlineSessions.map(({ userId }) => userId));
    const salesByUser = new Map<string, { revenue: number; orders: number; crates: number }>();
    const revenueTrend = Array.from({ length: 12 }, () => 0);
    const ordersTrend = Array.from({ length: 12 }, () => 0);
    let revenue = 0;

    for (const order of orders) {
        const sales = salesByUser.get(order.createdById) ?? { revenue: 0, orders: 0, crates: 0 };
        sales.orders += 1;
        const bucketIndex = Math.min(
            Math.floor(((order.orderDate.getTime() - start.getTime()) / Math.max(end.getTime() - start.getTime(), 1)) * 12),
            11,
        );
        ordersTrend[bucketIndex] += 1;

        for (const item of order.items) {
            const quantity = Number(item.quantity);
            const lineRevenue = quantity * Number(item.unitPrice);
            sales.revenue += lineRevenue;
            revenue += lineRevenue;
            if (item.product.unitOfMeasure.toLowerCase().includes("crate")) {
                sales.crates += quantity;
            }
            revenueTrend[bucketIndex] += lineRevenue;
        }

        salesByUser.set(order.createdById, sales);
    }

    const asrs = [...assignmentByUser.entries()].map(([userId, assignment]) => {
        const user = assignment.membership.user;
        const sales = salesByUser.get(userId) ?? { revenue: 0, orders: 0, crates: 0 };
        const active = user.status === "ACTIVE" && assignment.isActive;

        return {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profileImageUrl: user.profileImageUrl,
            status: user.status === "SUSPENDED" ? "Suspended" : active ? "Active" : "Inactive",
            online: onlineUserIds.has(userId),
            region: assignment.regionId ? regionNames.get(assignment.regionId) ?? null : null,
            territory: assignment.territoryId ? territoryNames.get(assignment.territoryId) ?? null : null,
            distributor: assignment.distributorId ? distributorNames.get(assignment.distributorId) ?? null : null,
            revenue: sales.revenue,
            orders: sales.orders,
            cratesSold: sales.crates,
            rating: null,
            visits: null,
            coolers: null,
            newOutlets: null,
        };
    }).sort((left, right) => right.revenue - left.revenue || left.name.localeCompare(right.name));

    const activeAsrs = asrs.filter((asr) => asr.status === "Active").length;
    const sellingAsrs = asrs.filter((asr) => asr.orders > 0).length;

    return {
        period,
        totalAsrs: asrs.length,
        activeAsrs,
        onlineNow: asrs.filter((asr) => asr.online).length,
        suspendedAsrs: asrs.filter((asr) => asr.status === "Suspended").length,
        revenue,
        sellingAsrs,
        visitingAsrs: null,
        averageRevenuePerAsr: activeAsrs ? revenue / activeAsrs : 0,
        currency: "KES",
        revenueTrend,
        ordersTrend,
        asrs,
    };
}