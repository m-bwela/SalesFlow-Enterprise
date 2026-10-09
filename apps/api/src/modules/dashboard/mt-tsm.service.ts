import { prisma } from "@salesflow/database";

import { AppError } from "../../errors/app-error.js";
import type { ModernTradePeriod } from "./dashboard.types.js";
import { buildRevenueTrend, getPeriodStart, orderRevenue, DAY_MS, TREND_BUCKETS, UNASSIGNED } from "./modern-trade.service.js";
import { REVENUE_COUNTED_STATUSES } from "./order-status.js";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export interface MtTsmFilters {
    period: ModernTradePeriod;
    regionId?: string;
    territoryId?: string;
    mtTsmId?: string;
}

// The MT_TSM-level dashboard: rows are MT_TSMs (not individual reps), each showing the MTSR team
// they lead. A team is every active MTSR assigned to the *same territory* as the MT_TSM — the
// same "match by territory, not by the whole region" rule used by the combined TSM dashboard.
export async function getMtTsmDashboard(organizationId: string, filters: MtTsmFilters) {
    const now = new Date();
    const periodStart = getPeriodStart(filters.period, now);

    const [mtTsmAssignments, mtsrAssignments] = await Promise.all([
        prisma.membershipRole.findMany({
            where: {
                role: { code: "MT_TSM" },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                membership: { organizationId, isActive: true, user: { status: { in: ["ACTIVE", "SUSPENDED", "DISABLED"] } } },
            },
            select: {
                regionId: true,
                territoryId: true,
                membership: {
                    select: {
                        user: { select: { id: true, displayName: true, email: true, phoneNumber: true, status: true } },
                    },
                },
            },
        }),
        prisma.membershipRole.findMany({
            where: {
                role: { code: "MTSR" },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                membership: { organizationId, isActive: true, user: { status: { in: ["ACTIVE", "SUSPENDED", "DISABLED"] } } },
            },
            select: {
                territoryId: true,
                membership: { select: { userId: true, user: { select: { displayName: true } } } },
            },
        }),
    ]);

    const regionIds = [...new Set(mtTsmAssignments.flatMap(({ regionId }) => regionId ? [regionId] : []))];
    const territoryIds = [...new Set(mtTsmAssignments.flatMap(({ territoryId }) => territoryId ? [territoryId] : []))];
    const [regions, territories] = await Promise.all([
        regionIds.length ? prisma.region.findMany({ where: { id: { in: regionIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
        territoryIds.length ? prisma.territory.findMany({ where: { id: { in: territoryIds } }, select: { id: true, name: true, regionId: true } }) : Promise.resolve([]),
    ]);
    const regionById = new Map(regions.map((region) => [region.id, region]));
    const territoryById = new Map(territories.map((territory) => [territory.id, territory]));

    // One entry per person, even if they hold several MT_TSM assignments.
    const mtTsmsById = new Map<string, {
        id: string; name: string; email: string; phone: string | null; status: string;
        regionId: string | null; territoryId: string | null;
    }>();
    for (const assignment of mtTsmAssignments) {
        const user = assignment.membership.user;
        if (mtTsmsById.has(user.id)) continue;
        mtTsmsById.set(user.id, {
            id: user.id,
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber,
            status: user.status,
            regionId: assignment.regionId,
            territoryId: assignment.territoryId,
        });
    }
    const allMtTsms = [...mtTsmsById.values()];
    const mtTsms = allMtTsms.filter((mtTsm) =>
        (!filters.regionId || mtTsm.regionId === filters.regionId) &&
        (!filters.territoryId || mtTsm.territoryId === filters.territoryId) &&
        (!filters.mtTsmId || mtTsm.id === filters.mtTsmId),
    );

    // Which MTSRs belong to which MT_TSM's team: matched by exact territory.
    const mtsrsByTerritory = new Map<string, string[]>();
    const mtsrNameById = new Map<string, string>();
    for (const assignment of mtsrAssignments) {
        mtsrNameById.set(assignment.membership.userId, assignment.membership.user.displayName);
        if (!assignment.territoryId) continue;
        const list = mtsrsByTerritory.get(assignment.territoryId) ?? [];
        list.push(assignment.membership.userId);
        mtsrsByTerritory.set(assignment.territoryId, list);
    }
    const teamByMtTsm = new Map<string, string[]>();
    for (const mtTsm of mtTsms) {
        teamByMtTsm.set(mtTsm.id, mtTsm.territoryId ? (mtsrsByTerritory.get(mtTsm.territoryId) ?? []) : []);
    }
    const allMtsrIds = [...new Set([...teamByMtTsm.values()].flat())];

    const [orders, outletCounts, onlineSessions] = allMtsrIds.length
        ? await Promise.all([
            prisma.salesOrder.findMany({
                where: {
                    organizationId,
                    createdById: { in: allMtsrIds },
                    orderDate: { gte: periodStart, lte: now },
                    currency: "KES",
                    status: { in: REVENUE_COUNTED_STATUSES },
                },
                select: {
                    id: true,
                    createdById: true,
                    outletId: true,
                    orderDate: true,
                    approvalStatus: true,
                    outlet: { select: { name: true } },
                    depot: { select: { name: true } },
                    items: { select: { quantity: true, unitPrice: true } },
                },
            }),
            prisma.outlet.groupBy({
                by: ["createdById"],
                where: { organizationId, isActive: true, createdById: { in: allMtsrIds } },
                _count: { _all: true },
            }),
            prisma.session.findMany({
                where: { userId: { in: mtTsms.map(({ id }) => id) }, revokedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } },
                select: { userId: true },
                distinct: ["userId"],
            }),
        ])
        : [[], [], []];

    const outletsByMtsr = new Map(outletCounts.flatMap((row) => row.createdById ? [[row.createdById, row._count._all] as const] : []));
    const onlineIds = new Set(onlineSessions.map(({ userId }) => userId));
    const ordersByMtsr = new Map<string, typeof orders>();
    for (const order of orders) {
        const list = ordersByMtsr.get(order.createdById) ?? [];
        list.push(order);
        ordersByMtsr.set(order.createdById, list);
    }

    const rows = mtTsms.map((mtTsm) => {
        const team = teamByMtTsm.get(mtTsm.id) ?? [];
        const teamOrders = team.flatMap((mtsrId) => ordersByMtsr.get(mtsrId) ?? []);
        const approvedOrders = teamOrders.filter((order) => order.approvalStatus === "APPROVED");
        const revenue = approvedOrders.reduce((total, order) => total + orderRevenue(order.items).revenue, 0);
        const volume = approvedOrders.reduce((total, order) => total + orderRevenue(order.items).volume, 0);
        const pendingInvoices = teamOrders.filter((order) => order.approvalStatus === "PENDING").length;
        const region = mtTsm.regionId ? regionById.get(mtTsm.regionId) : undefined;
        const territory = mtTsm.territoryId ? territoryById.get(mtTsm.territoryId) : undefined;
        return {
            id: mtTsm.id,
            name: mtTsm.name,
            email: mtTsm.email,
            phone: mtTsm.phone,
            status: mtTsm.status,
            online: onlineIds.has(mtTsm.id),
            region: region?.name ?? UNASSIGNED,
            territory: territory?.name ?? UNASSIGNED,
            mtsrTeamSize: team.length,
            outlets: team.reduce((total, mtsrId) => total + (outletsByMtsr.get(mtsrId) ?? 0), 0),
            revenue,
            volume,
            orders: approvedOrders.length,
            pendingInvoices,
        };
    }).sort((left, right) => right.revenue - left.revenue || left.name.localeCompare(right.name))
        .map((row, index) => ({ ...row, rank: index + 1 }));

    const approvedOrders = orders.filter((order) => order.approvalStatus === "APPROVED");
    const trendStart = filters.period === "ALL"
        ? new Date(Math.min(now.getTime() - DAY_MS, ...approvedOrders.map(({ orderDate }) => orderDate.getTime())))
        : periodStart;
    const revenueTrend = buildRevenueTrend(trendStart, now);
    const trendSpan = Math.max(now.getTime() - trendStart.getTime(), 1);
    for (const order of approvedOrders) {
        const position = (order.orderDate.getTime() - trendStart.getTime()) / trendSpan;
        const index = Math.min(Math.max(Math.floor(position * TREND_BUCKETS), 0), TREND_BUCKETS - 1);
        revenueTrend[index].revenue += orderRevenue(order.items).revenue;
        revenueTrend[index].orders += 1;
    }

    const mtTsmNameByMtsr = new Map<string, string>();
    for (const [mtTsmId, team] of teamByMtTsm) {
        const mtTsmName = mtTsmsById.get(mtTsmId)?.name ?? "Unknown";
        for (const mtsrId of team) mtTsmNameByMtsr.set(mtsrId, mtTsmName);
    }

    const sum = (pick: (row: (typeof rows)[number]) => number) => rows.reduce((total, row) => total + pick(row), 0);
    const totalRevenue = sum((row) => row.revenue);
    const totalOrders = sum((row) => row.orders);
    const activeMtTsms = mtTsms.filter(({ status }) => status === "ACTIVE").length;
    const invoiceStatusCounts = { pending: 0, approved: 0, rejected: 0 };
    for (const order of orders) {
        if (order.approvalStatus === "PENDING") invoiceStatusCounts.pending += 1;
        else if (order.approvalStatus === "APPROVED") invoiceStatusCounts.approved += 1;
        else invoiceStatusCounts.rejected += 1;
    }

    return {
        period: filters.period,
        updatedAt: now.toISOString(),
        currency: "KES",
        stats: {
            totalMtTsms: mtTsms.length,
            activeMtTsms,
            onlineNow: rows.filter(({ online }) => online).length,
            mtsrTeamSize: sum((row) => row.mtsrTeamSize),
            outlets: sum((row) => row.outlets),
            revenue: totalRevenue,
            orders: totalOrders,
            volume: sum((row) => row.volume),
            pendingInvoices: invoiceStatusCounts.pending,
            approvedInvoices: invoiceStatusCounts.approved,
            rejectedInvoices: invoiceStatusCounts.rejected,
            averageRevenuePerMtTsm: activeMtTsms ? totalRevenue / activeMtTsms : 0,
            averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        },
        options: {
            regions: regions.map(({ id, name }) => ({ id, name })),
            territories: territories.map(({ id, name, regionId }) => ({ id, name, regionId })),
            mtTsms: allMtTsms
                .map(({ id, name, regionId, territoryId }) => ({ id, name, regionId, territoryId }))
                .sort((left, right) => left.name.localeCompare(right.name)),
        },
        revenueTrend,
        rows,
        invoices: orders
            .map((order) => ({
                id: order.id,
                repId: order.createdById,
                repName: mtsrNameById.get(order.createdById) ?? "Unknown",
                mtTsmName: mtTsmNameByMtsr.get(order.createdById) ?? UNASSIGNED,
                outlet: order.outlet.name,
                depot: order.depot?.name ?? UNASSIGNED,
                amount: orderRevenue(order.items).revenue,
                status: order.approvalStatus,
                orderDate: order.orderDate.toISOString(),
            }))
            .sort((left, right) => right.orderDate.localeCompare(left.orderDate)),
    };
}

// Shared by the MT_TSM dashboard and the HORECA dashboard: an MT_TSM (or admin) approves or
// rejects a Pending invoice (a Depot-sourced sales order placed by an MTSR/HORECA rep).
export async function reviewInvoice(organizationId: string, orderId: string, reviewerId: string, action: "APPROVE" | "REJECT") {
    const order = await prisma.salesOrder.findFirst({
        where: { id: orderId, organizationId },
        select: { id: true, approvalStatus: true, depotId: true },
    });
    if (!order) throw new AppError("INVOICE_NOT_FOUND", 404, "Invoice not found.");
    if (!order.depotId) throw new AppError("NOT_A_DEPOT_INVOICE", 400, "This order was not placed through a Depot and has no invoice to review.");
    if (order.approvalStatus !== "PENDING") {
        throw new AppError("INVOICE_ALREADY_REVIEWED", 409, `This invoice has already been ${order.approvalStatus.toLowerCase()}.`);
    }

    return prisma.salesOrder.update({
        where: { id: orderId },
        data: {
            approvalStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
            reviewedById: reviewerId,
            reviewedAt: new Date(),
        },
        select: { id: true, approvalStatus: true, reviewedAt: true },
    });
}
