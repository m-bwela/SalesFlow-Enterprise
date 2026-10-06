import { prisma } from "@salesflow/database";
import type { Prisma } from "@prisma/client";

import type { ModernTradeFilters, ModernTradePeriod } from "./dashboard.types.js";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const TREND_BUCKETS = 12;
const UNASSIGNED = "Unassigned";

// How far back each rolling period reaches. LIVE, YTD and ALL are handled separately in getPeriodStart.
const ROLLING_PERIOD_MS: Partial<Record<ModernTradePeriod, number>> = {
    "1H": HOUR_MS,
    "6H": 6 * HOUR_MS,
    "1D": DAY_MS,
    "1W": 7 * DAY_MS,
    "1M": 30 * DAY_MS,
    "3M": 90 * DAY_MS,
    "6M": 180 * DAY_MS,
    "1Y": 365 * DAY_MS,
    "2Y": 730 * DAY_MS,
    "3Y": 1095 * DAY_MS,
};

// Midnight at the start of today in Nairobi time, expressed as a UTC instant.
function getEatDayStart(now: Date) {
    const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
    return new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate()) - EAT_OFFSET_MS);
}

function getPeriodStart(period: ModernTradePeriod, now: Date) {
    if (period === "ALL") return new Date(0);
    // LIVE means "today so far"; the page also refreshes itself every 30 seconds in this mode.
    if (period === "LIVE") return getEatDayStart(now);
    if (period === "YTD") {
        const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
        return new Date(Date.UTC(eatNow.getUTCFullYear(), 0, 1) - EAT_OFFSET_MS);
    }
    return new Date(now.getTime() - (ROLLING_PERIOD_MS[period] ?? DAY_MS));
}

function orderRevenue(items: Array<{ quantity: Prisma.Decimal; unitPrice: Prisma.Decimal }>) {
    let revenue = 0;
    let volume = 0;
    for (const item of items) {
        const quantity = Number(item.quantity);
        revenue += quantity * Number(item.unitPrice);
        volume += quantity;
    }
    return { revenue, volume };
    // If the company later wants discounts or VAT or Promotions, change it here only.
}

// Splits the period into equal intervals and labels them with a time (short periods) or a date (long ones).
function buildRevenueTrend(start: Date, end: Date) {
    const span = Math.max(end.getTime() - start.getTime(), 1);
    const shortPeriod = span <= 2 * DAY_MS;
    const formatter = new Intl.DateTimeFormat("en-GB", shortPeriod
        ? { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Nairobi" }
        : { day: "2-digit", month: "short", year: span > 400 * DAY_MS ? "2-digit" : undefined, timeZone: "Africa/Nairobi" });
    return Array.from({ length: TREND_BUCKETS }, (_, index) => ({
        bucket: formatter.format(new Date(start.getTime() + (span * index) / TREND_BUCKETS)),
        revenue: 0,
        orders: 0,
    }));
}

export async function getModernTradeDashboard(organizationId: string, filters: ModernTradeFilters) {
    const now = new Date();
    const periodStart = getPeriodStart(filters.period, now);

    const [regions, roleAssignments] = await Promise.all([
        prisma.region.findMany({
            where: { organizationId },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                code: true,
                territories: { orderBy: { name: "asc" }, select: { id: true, name: true, code: true } },
            },
        }),
        prisma.membershipRole.findMany({
            where: {
                role: { code: "MTSR" },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                // PENDING users are not on the system yet and ARCHIVED users are retired.
                membership: { organizationId, isActive: true, user: { status: { in: ["ACTIVE", "SUSPENDED", "DISABLED"] } } },
            },
            select: {
                regionId: true,
                territoryId: true,
                membership: { select: { user: { select: { id: true, displayName: true, email: true, phoneNumber: true, status: true } } } },
            },
        }),
    ]);

    const regionById = new Map(regions.map((region) => [region.id, region]));
    const territoryById = new Map(regions.flatMap((region) => region.territories.map((territory) => [territory.id, { ...territory, regionId: region.id }] as const)));

    // One entry per person, even if they hold several MTSR assignments.
    const repsById = new Map<string, {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        status: string;
        regionId: string | null;
        territoryId: string | null;
    }>();
    for (const assignment of roleAssignments) {
        const user = assignment.membership.user;
        if (repsById.has(user.id)) continue;
        const territory = assignment.territoryId ? territoryById.get(assignment.territoryId) : undefined;
        repsById.set(user.id, {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber,
            status: user.status,
            regionId: assignment.regionId ?? territory?.regionId ?? null,
            territoryId: assignment.territoryId,
        });
    }
    const allReps = [...repsById.values()];

    const reps = allReps.filter((rep) =>
        (!filters.regionId || rep.regionId === filters.regionId) &&
        (!filters.territoryId || rep.territoryId === filters.territoryId) &&
        (!filters.mtsrId || rep.id === filters.mtsrId),
    );
    const repIds = reps.map(({ id }) => id);

    const [orders, outletCounts, onlineSessions] = repIds.length
        ? await Promise.all([
            prisma.salesOrder.findMany({
                where: {
                    organizationId,
                    createdById: { in: repIds },
                    orderDate: { gte: periodStart, lte: now },
                    currency: "KES",
                    status: { notIn: ["DRAFT", "CANCELLED"] },
                },
                select: {
                    createdById: true,
                    outletId: true,
                    orderDate: true,
                    supplySource: true,
                    items: { select: { quantity: true, unitPrice: true } },
                },
            }),
            prisma.outlet.groupBy({
                by: ["createdById"],
                where: { organizationId, isActive: true, createdById: { in: repIds } },
                _count: { _all: true },
            }),
            prisma.session.findMany({
                where: { userId: { in: repIds }, revokedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } },
                select: { userId: true },
                distinct: ["userId"],
            }),
        ])
        : [[], [], []];

    const outletsByRep = new Map(outletCounts.flatMap((row) => row.createdById ? [[row.createdById, row._count._all] as const] : []));
    const onlineIds = new Set(onlineSessions.map(({ userId }) => userId));

    const totals = new Map<string, { revenue: number; volume: number; orders: number; factoryOrders: number; outletIds: Set<string> }>();
    const allOrderedOutletIds = new Set<string>();
    for (const order of orders) {
        const repTotals = totals.get(order.createdById) ?? { revenue: 0, volume: 0, orders: 0, factoryOrders: 0, outletIds: new Set<string>() };
        const { revenue, volume } = orderRevenue(order.items);
        repTotals.revenue += revenue;
        repTotals.volume += volume;
        repTotals.orders += 1;
        if (order.supplySource === "FACTORY") repTotals.factoryOrders += 1;
        repTotals.outletIds.add(order.outletId);
        allOrderedOutletIds.add(order.outletId);
        totals.set(order.createdById, repTotals);
    }

    // "ALL" starts at 1970, which would squash every order into the last bar, so start at the first real order instead.
    const trendStart = filters.period === "ALL"
        ? new Date(Math.min(now.getTime() - DAY_MS, ...orders.map(({ orderDate }) => orderDate.getTime())))
        : periodStart;
    const revenueTrend = buildRevenueTrend(trendStart, now);
    const trendSpan = Math.max(now.getTime() - trendStart.getTime(), 1);
    for (const order of orders) {
        const position = (order.orderDate.getTime() - trendStart.getTime()) / trendSpan;
        const index = Math.min(Math.max(Math.floor(position * TREND_BUCKETS), 0), TREND_BUCKETS - 1);
        revenueTrend[index].revenue += orderRevenue(order.items).revenue;
        revenueTrend[index].orders += 1;
    }

    const rows = reps.map((rep) => {
        const repTotals = totals.get(rep.id);
        const region = rep.regionId ? regionById.get(rep.regionId) : undefined;
        const territory = rep.territoryId ? territoryById.get(rep.territoryId) : undefined;
        return {
            id: rep.id,
            name: rep.name,
            email: rep.email,
            phone: rep.phone,
            status: rep.status,
            online: onlineIds.has(rep.id),
            region: region?.name ?? UNASSIGNED,
            territory: territory?.name ?? UNASSIGNED,
            revenue: repTotals?.revenue ?? 0,
            volume: repTotals?.volume ?? 0,
            outlets: outletsByRep.get(rep.id) ?? 0,
            outletsOrdering: repTotals?.outletIds.size ?? 0,
            orders: repTotals?.orders ?? 0,
            factoryOrders: repTotals?.factoryOrders ?? 0,
        };
    }).sort((left, right) => right.revenue - left.revenue || left.name.localeCompare(right.name))
        .map((row, index) => ({ ...row, rank: index + 1 }));

    const sum = (pick: (row: (typeof rows)[number]) => number) => rows.reduce((total, row) => total + pick(row), 0);
    const totalRevenue = sum((row) => row.revenue);
    const totalOrders = sum((row) => row.orders);
    const factoryOrders = sum((row) => row.factoryOrders);
    const activeReps = reps.filter(({ status }) => status === "ACTIVE").length;

    return {
        period: filters.period,
        updatedAt: now.toISOString(),
        currency: "KES",
        stats: {
            totalMtsrs: reps.length,
            activeMtsrs: activeReps,
            onlineNow: rows.filter(({ online }) => online).length,
            revenue: totalRevenue,
            orders: totalOrders,
            volume: sum((row) => row.volume),
            outlets: sum((row) => row.outlets),
            outletsOrdering: allOrderedOutletIds.size,
            factoryOrders,
            factoryShare: totalOrders ? (factoryOrders / totalOrders) * 100 : 0,
            averageRevenuePerMtsr: activeReps ? totalRevenue / activeReps : 0,
            averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        },
        // Filter choices come from the unfiltered data so the dropdowns do not shrink as you filter.
        options: {
            regions: regions
                .filter(({ code }) => !code.startsWith("UNASSIGNED"))
                .map((region) => ({
                    id: region.id,
                    name: region.name,
                    territories: region.territories.filter(({ code }) => code !== "UNASSIGNED").map(({ id, name }) => ({ id, name })),
                })),
            mtsrs: allReps
                .map(({ id, name, regionId, territoryId }) => ({ id, name, regionId, territoryId }))
                .sort((left, right) => left.name.localeCompare(right.name)),
        },
        revenueTrend,
        rows,
    };
}
