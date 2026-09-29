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
    ]);

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
    };
}