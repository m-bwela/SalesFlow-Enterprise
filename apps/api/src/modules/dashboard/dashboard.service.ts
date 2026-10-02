import { prisma } from "@salesflow/database";

import type { AsrDashboardPeriod, DashboardFilters, TsmDashboardFilters, TsmDashboardPeriod } from "./dashboard.types.js";

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

function getTsmPeriodRange(period: TsmDashboardPeriod, now: Date) {
    const eatOffset = 3 * 60 * 60 * 1000;
    const eatNow = new Date(now.getTime() + eatOffset);
    const todayStart = new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate()) - eatOffset);
    const weekStart = new Date(todayStart);
    const eatWeekday = new Date(weekStart.getTime() + eatOffset).getUTCDay();
    weekStart.setTime(weekStart.getTime() - ((eatWeekday + 6) % 7) * 24 * 60 * 60 * 1000);
    const monthStart = new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), 1) - eatOffset);
    const dayMs = 24 * 60 * 60 * 1000;

    switch (period) {
        case "TODAY":
            return { start: todayStart, end: now };
        case "YESTERDAY":
            return { start: new Date(todayStart.getTime() - dayMs), end: todayStart };
        case "THIS_WEEK":
            return { start: weekStart, end: now };
        case "LAST_WEEK":
            return { start: new Date(weekStart.getTime() - 7 * dayMs), end: weekStart };
        case "THIS_MONTH":
            return { start: monthStart, end: now };
        case "ALL":
            return { start: new Date(0), end: now };
    }
}

export async function getTsmDashboard(organizationId: string, filters: TsmDashboardFilters) {
    const now = new Date();
    const { start, end } = getTsmPeriodRange(filters.period, now);
    const onlineSince = new Date(now.getTime() - 5 * 60 * 1000);
    const [regions, territories, distributors, assignments] = await Promise.all([
        prisma.region.findMany({
            where: { organizationId, isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
        prisma.territory.findMany({
            where: { region: { organizationId }, isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, regionId: true },
        }),
        prisma.distributor.findMany({
            where: { territory: { region: { organizationId } }, isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, territoryId: true },
        }),
        prisma.membershipRole.findMany({
            where: {
                role: { code: { in: ["GT_TSM", "MT_TSM"] } },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                membership: { organizationId, isActive: true },
            },
            orderBy: [{ isActive: "desc" }, { startsAt: "desc" }],
            select: {
                scopeType: true,
                regionId: true,
                territoryId: true,
                distributorId: true,
                membership: {
                    select: {
                        user: {
                            select: { id: true, displayName: true, email: true, phoneNumber: true, status: true },
                        },
                    },
                },
            },
        }),
    ]);

    const regionById = new Map(regions.map((region) => [region.id, region]));
    const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
    const distributorById = new Map(distributors.map((distributor) => [distributor.id, distributor]));
    const territoriesByRegion = new Map<string, string[]>();
    for (const territory of territories) {
        const territoryIds = territoriesByRegion.get(territory.regionId) ?? [];
        territoryIds.push(territory.id);
        territoriesByRegion.set(territory.regionId, territoryIds);
    }
    const distributorsByTerritory = new Map<string, string[]>();
    for (const distributor of distributors) {
        const distributorIds = distributorsByTerritory.get(distributor.territoryId) ?? [];
        distributorIds.push(distributor.id);
        distributorsByTerritory.set(distributor.territoryId, distributorIds);
    }

    const assignmentsByUser = new Map<string, (typeof assignments)>();
    for (const assignment of assignments) {
        const userId = assignment.membership.user.id;
        const current = assignmentsByUser.get(userId) ?? [];
        current.push(assignment);
        assignmentsByUser.set(userId, current);
    }

    const allRegionIds = regions.map(({ id }) => id);
    const allTerritoryIds = territories.map(({ id }) => id);
    const allDistributorIds = distributors.map(({ id }) => id);
    const tsmScopes = [...assignmentsByUser.entries()].map(([userId, userAssignments]) => {
        const scopeRegionIds = new Set<string>();
        const scopeTerritoryIds = new Set<string>();
        const scopeDistributorIds = new Set<string>();

        for (const assignment of userAssignments) {
            if (assignment.scopeType === "GLOBAL") {
                allRegionIds.forEach((id) => scopeRegionIds.add(id));
                allTerritoryIds.forEach((id) => scopeTerritoryIds.add(id));
                allDistributorIds.forEach((id) => scopeDistributorIds.add(id));
            } else if (assignment.regionId) {
                scopeRegionIds.add(assignment.regionId);
                (territoriesByRegion.get(assignment.regionId) ?? []).forEach((id) => scopeTerritoryIds.add(id));
            } else if (assignment.territoryId) {
                scopeTerritoryIds.add(assignment.territoryId);
                const territory = territoryById.get(assignment.territoryId);
                if (territory) scopeRegionIds.add(territory.regionId);
            }

            if (assignment.distributorId) {
                scopeDistributorIds.add(assignment.distributorId);
                const distributor = distributorById.get(assignment.distributorId);
                if (distributor) {
                    scopeTerritoryIds.add(distributor.territoryId);
                    const territory = territoryById.get(distributor.territoryId);
                    if (territory) scopeRegionIds.add(territory.regionId);
                }
            }
        }

        for (const territoryId of scopeTerritoryIds) {
            (distributorsByTerritory.get(territoryId) ?? []).forEach((id) => scopeDistributorIds.add(id));
        }

        const matchesRegion = !filters.regionId || scopeRegionIds.has(filters.regionId);
        const matchesTerritory = !filters.territoryId || scopeTerritoryIds.has(filters.territoryId);
        return {
            userId,
            user: userAssignments[0].membership.user,
            regionIds: [...scopeRegionIds],
            territoryIds: [...scopeTerritoryIds],
            distributorIds: [...scopeDistributorIds],
            matchesFilter: matchesRegion && matchesTerritory,
        };
    }).filter((scope) => scope.matchesFilter);

    const tsmUserIds = tsmScopes.map(({ userId }) => userId);
    const scopedDistributorIds = [...new Set(tsmScopes.flatMap(({ distributorIds }) => distributorIds))];
    const [sessions, lastSessions, orders, asrAssignments] = await Promise.all([
        tsmUserIds.length ? prisma.session.findMany({
            where: { userId: { in: tsmUserIds }, revokedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: onlineSince } },
            select: { userId: true },
            distinct: ["userId"],
        }) : Promise.resolve([]),
        tsmUserIds.length ? prisma.session.findMany({
            where: { userId: { in: tsmUserIds } },
            orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
            select: { userId: true, lastSeenAt: true, createdAt: true },
        }) : Promise.resolve([]),
        scopedDistributorIds.length ? prisma.salesOrder.findMany({
            where: {
                organizationId,
                distributorId: { in: scopedDistributorIds },
                orderDate: { gte: start, lt: end },
                currency: "KES",
                status: { notIn: ["DRAFT", "CANCELLED"] },
            },
            select: {
                distributorId: true,
                status: true,
                expectedDeliveryAt: true,
                items: { select: { quantity: true, unitPrice: true } },
            },
        }) : Promise.resolve([]),
        prisma.membershipRole.findMany({
            where: {
                role: { code: "ASR" },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                membership: { organizationId, isActive: true, user: { status: "ACTIVE" } },
            },
            select: { regionId: true, territoryId: true, distributorId: true, membership: { select: { userId: true } } },
        }),
    ]);

    const onlineIds = new Set(sessions.map(({ userId }) => userId));
    const lastLoginByUser = new Map<string, Date>();
    for (const session of lastSessions) {
        if (!lastLoginByUser.has(session.userId)) {
            lastLoginByUser.set(session.userId, session.lastSeenAt ?? session.createdAt);
        }
    }
    const ordersByDistributor = new Map<string, typeof orders>();
    for (const order of orders) {
        const distributorOrders = ordersByDistributor.get(order.distributorId) ?? [];
        distributorOrders.push(order);
        ordersByDistributor.set(order.distributorId, distributorOrders);
    }
    const asrsByTsm = new Map<string, Set<string>>();
    for (const scope of tsmScopes) {
        const attached = asrAssignments.filter((assignment) =>
            Boolean(assignment.distributorId && scope.distributorIds.includes(assignment.distributorId)) ||
            Boolean(assignment.territoryId && scope.territoryIds.includes(assignment.territoryId)) ||
            Boolean(assignment.regionId && scope.regionIds.includes(assignment.regionId)),
        );
        asrsByTsm.set(scope.userId, new Set(attached.map(({ membership }) => membership.userId)));
    }

    const rows = tsmScopes.map((scope) => {
        const scopedOrders = scope.distributorIds.flatMap((id) => ordersByDistributor.get(id) ?? []);
        const processed = scopedOrders.length;
        const delivered = scopedOrders.filter((order) => order.status === "DELIVERED").length;
        const delayed = scopedOrders.filter((order) =>
            order.expectedDeliveryAt && order.expectedDeliveryAt < now && order.status !== "DELIVERED",
        ).length;
        const revenue = scopedOrders.reduce((total, order) => total + order.items.reduce(
            (orderTotal, item) => orderTotal + Number(item.quantity) * Number(item.unitPrice),
            0,
        ), 0);
        const regionNames = [...new Set(scope.regionIds.map((id) => regionById.get(id)?.name).filter((name): name is string => Boolean(name)))];
        const territoryNames = [...new Set(scope.territoryIds.map((id) => territoryById.get(id)?.name).filter((name): name is string => Boolean(name)))];

        return {
            id: scope.userId,
            name: scope.user.displayName,
            email: scope.user.email,
            phone: scope.user.phoneNumber,
            status: scope.user.status === "ACTIVE" ? "Active" : "Inactive",
            online: onlineIds.has(scope.userId),
            region: regionNames.join(", ") || "Unassigned",
            territory: territoryNames.join(", ") || "Unassigned",
            distributors: scope.distributorIds.length,
            asrs: asrsByTsm.get(scope.userId)?.size ?? 0,
            revenue,
            processed,
            delayed,
            delivered,
            lastLogin: lastLoginByUser.get(scope.userId)?.toISOString() ?? null,
        };
    }).sort((left, right) => right.revenue - left.revenue || left.name.localeCompare(right.name));

    const overallOrderIds = new Set(orders.map((order) => order.distributorId));
    const uniqueScopedOrders = [...overallOrderIds].flatMap((distributorId) => ordersByDistributor.get(distributorId) ?? []);
    const activeTsmCount = tsmScopes.filter(({ user }) => user.status === "ACTIVE").length;
    const totalRevenue = uniqueScopedOrders.reduce((total, order) => total + order.items.reduce(
        (orderTotal, item) => orderTotal + Number(item.quantity) * Number(item.unitPrice),
        0,
    ), 0);
    const processedOrders = uniqueScopedOrders.length;
    const deliveredOrders = uniqueScopedOrders.filter((order) => order.status === "DELIVERED").length;

    return {
        period: filters.period,
        updatedAt: now.toISOString(),
        stats: {
            totalTsms: tsmScopes.length,
            activeTsms: activeTsmCount,
            onlineNow: tsmScopes.filter(({ userId }) => onlineIds.has(userId)).length,
            distributors: scopedDistributorIds.length,
            asrsAttached: new Set(tsmScopes.flatMap(({ userId }) => [...(asrsByTsm.get(userId) ?? [])])).size,
            revenue: totalRevenue,
            ordersProcessed: processedOrders,
            deliveryRate: processedOrders ? (deliveredOrders / processedOrders) * 100 : 0,
        },
        regions,
        territories: territories
            .filter(({ regionId }) => !filters.regionId || regionId === filters.regionId)
            .map(({ id, name, regionId }) => ({ id, name, regionId })),
        rows: rows.map((row, index) => ({ ...row, rank: index + 1 })),
    };
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