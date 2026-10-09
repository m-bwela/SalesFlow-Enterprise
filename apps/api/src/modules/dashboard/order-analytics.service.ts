import { prisma } from "@salesflow/database";
import type { RoleCode, SalesOrderStatus } from "@prisma/client";

import { ALL_ORDER_STATUSES, REVENUE_COUNTED_STATUSES } from "./order-status.js";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const UNASSIGNED = "Unassigned";
// "Agent" covers every field rep channel: ASR (distributor), MTSR and HORECA (both Depot).
const AGENT_ROLE_CODES: RoleCode[] = ["ASR", "MTSR", "HORECA"];
const DEFAULT_RANGE_DAYS = 30;
const VOLUME_WINDOW_DAYS = 30;

export type TrendGranularity = "DAILY" | "WEEKLY" | "MONTHLY";

export interface OrderAnalyticsFilters {
    startDate?: string;
    endDate?: string;
    regionId?: string;
    territoryId?: string;
    agentId?: string;
    granularity?: TrendGranularity;
}

function getEatDayStart(date: Date) {
    const eatDate = new Date(date.getTime() + EAT_OFFSET_MS);
    return new Date(Date.UTC(eatDate.getUTCFullYear(), eatDate.getUTCMonth(), eatDate.getUTCDate()) - EAT_OFFSET_MS);
}

function getEatWeekStart(date: Date) {
    const start = getEatDayStart(date);
    const eatDay = new Date(start.getTime() + EAT_OFFSET_MS).getUTCDay();
    start.setTime(start.getTime() - ((eatDay + 6) % 7) * DAY_MS);
    return start;
}

function getEatMonthStart(date: Date) {
    const eatDate = new Date(date.getTime() + EAT_OFFSET_MS);
    return new Date(Date.UTC(eatDate.getUTCFullYear(), eatDate.getUTCMonth(), 1) - EAT_OFFSET_MS);
}

// Parses a "YYYY-MM-DD" filter value as the start of that day in Nairobi time.
function parseEatDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day) - EAT_OFFSET_MS);
}

function orderRevenue(items: Array<{ quantity: { toString(): string }; unitPrice: { toString(): string } }>) {
    let revenue = 0;
    let volume = 0;
    for (const item of items) {
        const quantity = Number(item.quantity);
        revenue += quantity * Number(item.unitPrice);
        volume += quantity;
    }
    return { revenue, volume };
}

function formatPercent(value: number) {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

async function getAgents(organizationId: string, now: Date) {
    const assignments = await prisma.membershipRole.findMany({
        where: {
            role: { code: { in: AGENT_ROLE_CODES } },
            isActive: true,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
            membership: { organizationId, isActive: true, user: { status: { in: ["ACTIVE", "SUSPENDED", "DISABLED"] } } },
        },
        select: {
            regionId: true,
            territoryId: true,
            role: { select: { code: true } },
            membership: { select: { user: { select: { id: true, displayName: true, email: true, phoneNumber: true, status: true } } } },
        },
    });

    const regionIds = [...new Set(assignments.flatMap(({ regionId }) => regionId ? [regionId] : []))];
    const territoryIds = [...new Set(assignments.flatMap(({ territoryId }) => territoryId ? [territoryId] : []))];
    const [regions, territories] = await Promise.all([
        regionIds.length ? prisma.region.findMany({ where: { id: { in: regionIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
        territoryIds.length ? prisma.territory.findMany({ where: { id: { in: territoryIds } }, select: { id: true, name: true, regionId: true } }) : Promise.resolve([]),
    ]);
    const regionById = new Map(regions.map((region) => [region.id, region]));
    const territoryById = new Map(territories.map((territory) => [territory.id, territory]));

    const agentsById = new Map<string, {
        id: string; name: string; email: string; phone: string | null; status: string; roleCode: string;
        regionId: string | null; territoryId: string | null;
    }>();
    for (const assignment of assignments) {
        const user = assignment.membership.user;
        if (agentsById.has(user.id)) continue;
        agentsById.set(user.id, {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber,
            status: user.status,
            roleCode: assignment.role.code,
            regionId: assignment.regionId,
            territoryId: assignment.territoryId,
        });
    }

    return { agents: [...agentsById.values()], regionById, territoryById, regions, territories };
}

function bucketLabel(date: Date, granularity: TrendGranularity) {
    if (granularity === "MONTHLY") {
        return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "Africa/Nairobi" }).format(date);
    }
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Africa/Nairobi" }).format(date);
}

// Builds one real calendar bucket per day/week/month across the range (not a fixed count), so a
// 90-day "Daily" view shows ~90 bars while a 90-day "Monthly" view shows ~3.
function buildTrendBuckets(start: Date, end: Date, granularity: TrendGranularity) {
    const buckets: Array<{ start: Date; end: Date; label: string }> = [];
    let cursor = granularity === "MONTHLY" ? getEatMonthStart(start) : granularity === "WEEKLY" ? getEatWeekStart(start) : getEatDayStart(start);
    while (cursor < end) {
        const next = new Date(cursor.getTime() + (granularity === "DAILY" ? DAY_MS : granularity === "WEEKLY" ? 7 * DAY_MS : 0));
        const bucketEnd = granularity === "MONTHLY"
            ? new Date(Date.UTC(new Date(cursor.getTime() + EAT_OFFSET_MS).getUTCFullYear(), new Date(cursor.getTime() + EAT_OFFSET_MS).getUTCMonth() + 1, 1) - EAT_OFFSET_MS)
            : next;
        buckets.push({ start: cursor, end: bucketEnd, label: bucketLabel(cursor, granularity) });
        cursor = bucketEnd;
    }
    return buckets;
}

export async function getOrderAnalyticsOverview(organizationId: string, filters: OrderAnalyticsFilters) {
    const now = new Date();
    const granularity = filters.granularity ?? "DAILY";
    const rangeEnd = filters.endDate ? new Date(parseEatDate(filters.endDate).getTime() + DAY_MS) : now;
    const rangeStart = filters.startDate ? parseEatDate(filters.startDate) : new Date(getEatDayStart(now).getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_MS);

    const { agents, regionById, territoryById, regions, territories } = await getAgents(organizationId, now);
    const scopedAgents = agents.filter((agent) =>
        (!filters.regionId || agent.regionId === filters.regionId) &&
        (!filters.territoryId || agent.territoryId === filters.territoryId) &&
        (!filters.agentId || agent.id === filters.agentId),
    );
    const agentIds = scopedAgents.map(({ id }) => id);
    const agentById = new Map(scopedAgents.map((agent) => [agent.id, agent]));

    const monthStart = getEatMonthStart(now);
    const weekStart = getEatWeekStart(now);
    const todayStart = getEatDayStart(now);
    const volumeWindowStart = new Date(getEatDayStart(now).getTime() - (VOLUME_WINDOW_DAYS - 1) * DAY_MS);

    const [rangeOrders, kpiWindowOrders, volumeWindowOrders] = agentIds.length
        ? await Promise.all([
            prisma.salesOrder.findMany({
                where: { organizationId, createdById: { in: agentIds }, currency: "KES", orderDate: { gte: rangeStart, lt: rangeEnd } },
                select: {
                    id: true, createdById: true, outletId: true, orderDate: true, status: true,
                    outlet: { select: { name: true } },
                    items: { select: { quantity: true, unitPrice: true } },
                },
            }),
            // Independent of the Start/End filters: always "as of today", so Today/This Week/This
            // Month KPIs read correctly even when a narrower custom range is selected above.
            prisma.salesOrder.findMany({
                where: { organizationId, createdById: { in: agentIds }, currency: "KES", orderDate: { gte: monthStart, lte: now } },
                select: { createdById: true, orderDate: true, status: true, items: { select: { quantity: true, unitPrice: true } } },
            }),
            // Fixed 30-day window for the Order Volume chart, independent of the Start/End filters.
            prisma.salesOrder.findMany({
                where: { organizationId, createdById: { in: agentIds }, currency: "KES", orderDate: { gte: volumeWindowStart, lte: now } },
                select: { orderDate: true },
            }),
        ])
        : [[], [], []];

    const revenueCounted = (status: SalesOrderStatus) => (REVENUE_COUNTED_STATUSES as string[]).includes(status);
    const rangeRevenueOrders = rangeOrders.filter((order) => revenueCounted(order.status));

    // ---- KPIs ----
    const todaysRevenueOrders = kpiWindowOrders.filter((order) => revenueCounted(order.status) && order.orderDate >= todayStart);
    const weekRevenueOrders = kpiWindowOrders.filter((order) => revenueCounted(order.status) && order.orderDate >= weekStart);
    const monthRevenueOrders = kpiWindowOrders.filter((order) => revenueCounted(order.status));
    const sumRevenue = (list: Array<{ items: Array<{ quantity: { toString(): string }; unitPrice: { toString(): string } }> }>) =>
        list.reduce((total, order) => total + orderRevenue(order.items).revenue, 0);

    const rangeRevenue = sumRevenue(rangeRevenueOrders);
    const deliveredInRange = rangeRevenueOrders.filter((order) => order.status === "DELIVERED").length;

    const stats = {
        todaysOrders: todaysRevenueOrders.length,
        todaysRevenue: sumRevenue(todaysRevenueOrders),
        thisWeekRevenue: sumRevenue(weekRevenueOrders),
        thisMonthRevenue: sumRevenue(monthRevenueOrders),
        averageOrderValue: rangeRevenueOrders.length ? rangeRevenue / rangeRevenueOrders.length : 0,
        deliveryRate: rangeRevenueOrders.length ? (deliveredInRange / rangeRevenueOrders.length) * 100 : 0,
    };

    // ---- Revenue trend (Daily/Weekly/Monthly, selected range) ----
    const trendBuckets = buildTrendBuckets(rangeStart, rangeEnd, granularity).map((bucket) => ({ ...bucket, revenue: 0, orders: 0 }));
    for (const order of rangeRevenueOrders) {
        const bucket = trendBuckets.find((candidate) => order.orderDate >= candidate.start && order.orderDate < candidate.end);
        if (!bucket) continue;
        bucket.revenue += orderRevenue(order.items).revenue;
        bucket.orders += 1;
    }
    const revenueTrend = trendBuckets.map(({ label, revenue, orders }) => ({ bucket: label, revenue, orders }));

    // ---- Order volume (fixed last 30 days, every status counts as field activity) ----
    const volumeBuckets = Array.from({ length: VOLUME_WINDOW_DAYS }, (_, index) => {
        const dayStart = new Date(volumeWindowStart.getTime() + index * DAY_MS);
        return { start: dayStart, end: new Date(dayStart.getTime() + DAY_MS), label: bucketLabel(dayStart, "DAILY"), orders: 0 };
    });
    for (const order of volumeWindowOrders) {
        const bucket = volumeBuckets.find((candidate) => order.orderDate >= candidate.start && order.orderDate < candidate.end);
        if (bucket) bucket.orders += 1;
    }
    const orderVolumeTrend = volumeBuckets.map(({ label, orders }) => ({ bucket: label, orders }));

    // ---- Territory performance / leaders (range, revenue-counted) ----
    const territoryRevenue = new Map<string, number>();
    for (const order of rangeRevenueOrders) {
        const agent = agentById.get(order.createdById);
        const key = agent?.territoryId ?? UNASSIGNED;
        territoryRevenue.set(key, (territoryRevenue.get(key) ?? 0) + orderRevenue(order.items).revenue);
    }
    const territoryPerformance = [...territoryRevenue.entries()]
        .map(([territoryId, revenue]) => ({ territoryId, territory: territoryId === UNASSIGNED ? UNASSIGNED : territoryById.get(territoryId)?.name ?? UNASSIGNED, revenue }))
        .sort((left, right) => right.revenue - left.revenue);
    const territoryLeaders = territoryPerformance.slice(0, 10);

    // ---- Order status distribution (range, every status) ----
    const statusCounts = new Map<SalesOrderStatus, number>();
    for (const order of rangeOrders) statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    const orderStatusDistribution = ALL_ORDER_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }));

    // ---- Best outlets / top agents (range, revenue-counted, top 10) ----
    const outletTotals = new Map<string, { name: string; revenue: number; orders: number }>();
    const agentTotals = new Map<string, { revenue: number; orders: number }>();
    for (const order of rangeRevenueOrders) {
        const outletEntry = outletTotals.get(order.outletId) ?? { name: order.outlet.name, revenue: 0, orders: 0 };
        const { revenue } = orderRevenue(order.items);
        outletEntry.revenue += revenue;
        outletEntry.orders += 1;
        outletTotals.set(order.outletId, outletEntry);

        const agentEntry = agentTotals.get(order.createdById) ?? { revenue: 0, orders: 0 };
        agentEntry.revenue += revenue;
        agentEntry.orders += 1;
        agentTotals.set(order.createdById, agentEntry);
    }
    const bestOutlets = [...outletTotals.entries()]
        .map(([id, entry]) => ({ id, name: entry.name, revenue: entry.revenue, orders: entry.orders }))
        .sort((left, right) => right.revenue - left.revenue)
        .slice(0, 10);
    const topAgents = [...agentTotals.entries()]
        .map(([id, entry]) => ({ id, name: agentById.get(id)?.name ?? "Unknown", role: agentById.get(id)?.roleCode ?? "", revenue: entry.revenue, orders: entry.orders }))
        .sort((left, right) => right.revenue - left.revenue)
        .slice(0, 10);

    // ---- Insights: short, real, computed sentences ----
    const firstHalf = trendBuckets.slice(0, Math.ceil(trendBuckets.length / 2)).reduce((total, bucket) => total + bucket.revenue, 0);
    const secondHalf = trendBuckets.slice(Math.ceil(trendBuckets.length / 2)).reduce((total, bucket) => total + bucket.revenue, 0);
    const revenueTrendInsight = rangeRevenue === 0
        ? "No revenue recorded yet in this range."
        : firstHalf === 0
            ? "Revenue is concentrated in the second half of this range."
            : `Revenue moved ${formatPercent(((secondHalf - firstHalf) / firstHalf) * 100)} from the first half of this range to the second.`;

    const totalVolume = orderVolumeTrend.reduce((total, bucket) => total + bucket.orders, 0);
    const busiestVolumeDay = orderVolumeTrend.reduce((best, bucket) => (bucket.orders > best.orders ? bucket : best), orderVolumeTrend[0]);
    const volumeInsight = totalVolume === 0
        ? "No orders recorded in the last 30 days."
        : `${formatNumberPlain(totalVolume)} orders in the last 30 days; the busiest day was ${busiestVolumeDay.bucket} with ${busiestVolumeDay.orders}.`;

    const territoryPerformanceInsight = territoryPerformance.length === 0
        ? "No territory has recorded revenue in this range."
        : `${territoryPerformance[0].territory} leads with ${formatCurrencyPlain(territoryPerformance[0].revenue)}${territoryPerformance.length > 1 ? `, ahead of ${territoryPerformance[1].territory}.` : "."}`;

    const totalStatusOrders = orderStatusDistribution.reduce((total, entry) => total + entry.count, 0);
    const leadingStatus = orderStatusDistribution.reduce((best, entry) => (entry.count > best.count ? entry : best), orderStatusDistribution[0]);
    const orderStatusInsight = totalStatusOrders === 0
        ? "No orders recorded in this range."
        : `${leadingStatus.status} accounts for ${formatNumberPlain(leadingStatus.count)} of ${formatNumberPlain(totalStatusOrders)} orders (${((leadingStatus.count / totalStatusOrders) * 100).toFixed(1)}%).`;

    return {
        updatedAt: now.toISOString(),
        currency: "KES",
        range: { startDate: rangeStart.toISOString(), endDate: new Date(rangeEnd.getTime() - 1).toISOString() },
        granularity,
        stats,
        revenueTrend,
        orderVolumeTrend,
        territoryPerformance,
        territoryLeaders,
        orderStatusDistribution,
        bestOutlets,
        topAgents,
        insights: {
            revenueTrend: revenueTrendInsight,
            volume: volumeInsight,
            territoryPerformance: territoryPerformanceInsight,
            orderStatus: orderStatusInsight,
        },
        options: {
            regions: regions.map(({ id, name }) => ({ id, name })),
            territories: territories.map(({ id, name, regionId }) => ({ id, name, regionId })),
            agents: agents
                .map(({ id, name, roleCode, regionId, territoryId }) => ({ id, name, roleCode, regionId, territoryId }))
                .sort((left, right) => left.name.localeCompare(right.name)),
        },
    };
}

function formatNumberPlain(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrencyPlain(value: number) {
    return `KES ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

// Powers the "Agent Performance - Time at outlets" table. An agent is "active" that day if they
// placed at least one order (any status — this tracks field presence, not confirmed revenue).
// Route/Total Time/Avg per Outlet/Start/End are not tracked anywhere in the app yet.
export async function getAgentPerformanceForDay(organizationId: string, dateIso: string) {
    const dayStart = parseEatDate(dateIso);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const now = new Date();

    const { agents } = await getAgents(organizationId, now);
    const agentIds = agents.map(({ id }) => id);
    const agentById = new Map(agents.map((agent) => [agent.id, agent]));

    const orders = agentIds.length
        ? await prisma.salesOrder.findMany({
            where: { organizationId, createdById: { in: agentIds }, currency: "KES", orderDate: { gte: dayStart, lt: dayEnd } },
            select: { createdById: true, outletId: true, status: true, items: { select: { quantity: true, unitPrice: true } } },
        })
        : [];

    const totals = new Map<string, { outletIds: Set<string>; revenue: number }>();
    for (const order of orders) {
        const entry = totals.get(order.createdById) ?? { outletIds: new Set<string>(), revenue: 0 };
        entry.outletIds.add(order.outletId);
        if ((REVENUE_COUNTED_STATUSES as string[]).includes(order.status)) {
            entry.revenue += orderRevenue(order.items).revenue;
        }
        totals.set(order.createdById, entry);
    }

    const rows = [...totals.entries()]
        .map(([agentId, entry]) => ({
            id: agentId,
            name: agentById.get(agentId)?.name ?? "Unknown",
            role: agentById.get(agentId)?.roleCode ?? "",
            route: null,
            outlets: entry.outletIds.size,
            totalTime: null,
            averagePerOutlet: null,
            revenue: entry.revenue,
            start: null,
            end: null,
        }))
        .sort((left, right) => right.revenue - left.revenue);

    return {
        date: dateIso,
        currency: "KES",
        activeAgentCount: rows.length,
        rows,
    };
}
