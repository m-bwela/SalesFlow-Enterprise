import { prisma } from "@salesflow/database";
import type { Prisma } from "@prisma/client";

import { AppError } from "../../errors/app-error.js";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const UNASSIGNED_TERRITORY_CODE = "UNASSIGNED";

// The internal slug stored on Territory.code (distinct from the short outlet-code-ready `shortCode`).
const toCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

function getEatMonthStart(now: Date) {
    const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
    return new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), 1) - EAT_OFFSET_MS);
}

function orderTotals(items: Array<{ quantity: Prisma.Decimal; unitPrice: Prisma.Decimal }>) {
    let revenue = 0;
    let volume = 0;
    for (const item of items) {
        const quantity = Number(item.quantity);
        revenue += quantity * Number(item.unitPrice);
        volume += quantity;
    }
    return { revenue, volume };
}

// Initials of each word, e.g. "North Coast" -> "NC". Falls back to the first letters of the slug
// if the name has no separate words (e.g. "Nairobi" -> "NA").
function initialsOf(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) return words.map((word) => word[0]!.toUpperCase()).join("");
    return (words[0] ?? "").slice(0, 2).toUpperCase();
}

async function generateShortCode(organizationId: string, name: string) {
    const base = initialsOf(name) || "TR";
    let candidate = base;
    let suffix = 2;
    // Keep trying BASE, BASE2, BASE3, ... until one isn't already taken in this organization.
    while (await prisma.territory.findFirst({ where: { organizationId, shortCode: candidate }, select: { id: true } })) {
        candidate = `${base}${suffix}`;
        suffix += 1;
    }
    return candidate;
}

async function assertRealTerritory(id: string, organizationId: string) {
    const territory = await prisma.territory.findFirst({
        where: { id, organizationId, code: { not: UNASSIGNED_TERRITORY_CODE } },
        select: { id: true, regionId: true, shortCode: true },
    });
    if (!territory) throw new AppError("TERRITORY_NOT_FOUND", 404, "Territory not found.");
    return territory;
}

export async function createTerritory(organizationId: string, regionId: string, name: string) {
    const region = await prisma.region.findFirst({ where: { id: regionId, organizationId }, select: { id: true } });
    if (!region) throw new AppError("INVALID_REGION", 400, "Choose a region in this organization.");
    return prisma.territory.upsert({
        where: { regionId_code: { regionId, code: toCode(name) } },
        update: {},
        create: { regionId, organizationId, name, code: toCode(name) },
        select: { id: true, name: true, regionId: true, shortCode: true },
    });
}

// Powers the "Add New Territory" form: pick an existing territory (and give it a code if it
// doesn't have one yet), or type a brand-new name (creates the territory, then codes it).
export async function createOrCodeTerritory(organizationId: string, input: { regionId: string; territoryId?: string; name?: string }) {
    const region = await prisma.region.findFirst({ where: { id: input.regionId, organizationId }, select: { id: true } });
    if (!region) throw new AppError("INVALID_REGION", 400, "Choose a region in this organization.");

    let territory: { id: string; name: string; regionId: string; shortCode: string | null };
    if (input.territoryId) {
        const existing = await prisma.territory.findFirst({
            where: { id: input.territoryId, regionId: input.regionId, organizationId, code: { not: UNASSIGNED_TERRITORY_CODE } },
            select: { id: true, name: true, regionId: true, shortCode: true },
        });
        if (!existing) throw new AppError("INVALID_TERRITORY", 400, "Choose a territory that belongs to the selected region.");
        territory = existing;
    } else {
        if (!input.name?.trim()) throw new AppError("TERRITORY_NAME_REQUIRED", 400, "Choose an existing territory or type a new territory name.");
        territory = await createTerritory(organizationId, input.regionId, input.name.trim());
    }

    if (territory.shortCode) return territory;

    const shortCode = await generateShortCode(organizationId, territory.name);
    return prisma.territory.update({ where: { id: territory.id }, data: { shortCode }, select: { id: true, name: true, regionId: true, shortCode: true } });
}

export async function setTerritoryStatus(id: string, organizationId: string, isActive: boolean) {
    await assertRealTerritory(id, organizationId);
    return prisma.territory.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true } });
}

export async function deleteTerritory(id: string, organizationId: string) {
    await assertRealTerritory(id, organizationId);
    const [distributorCount, outletCount] = await Promise.all([
        prisma.distributor.count({ where: { territoryId: id } }),
        prisma.outlet.count({ where: { distributor: { territoryId: id } } }),
    ]);
    if (distributorCount > 0 || outletCount > 0) {
        throw new AppError("TERRITORY_IN_USE", 409, "This territory still has distributors or outlets attached. Reassign or remove them first.");
    }
    await prisma.territory.delete({ where: { id } });
    return { id };
}

export async function getTerritoriesOverview(organizationId: string) {
    const now = new Date();
    const monthStart = getEatMonthStart(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

    const [regions, territories] = await Promise.all([
        prisma.region.findMany({
            where: { organizationId, code: { not: { startsWith: "UNASSIGNED" } } },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                territories: {
                    where: { code: { not: UNASSIGNED_TERRITORY_CODE } },
                    orderBy: { name: "asc" },
                    select: { id: true, name: true, shortCode: true },
                },
            },
        }),
        prisma.territory.findMany({
            where: { organizationId, code: { not: UNASSIGNED_TERRITORY_CODE } },
            orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                shortCode: true,
                isActive: true,
                createdAt: true,
                regionId: true,
                region: { select: { id: true, name: true } },
                distributors: {
                    select: {
                        id: true,
                        isActive: true,
                        outlets: { select: { id: true, isActive: true, coolerCount: true } },
                    },
                },
            },
        }),
    ]);

    const territoryIds = territories.map(({ id }) => id);
    const distributorIds = territories.flatMap((territory) => territory.distributors.map(({ id }) => id));
    const allOutlets = territories.flatMap((territory) => territory.distributors.flatMap((distributor) => distributor.outlets));
    const activeDistributors = territories.flatMap((territory) => territory.distributors).filter(({ isActive }) => isActive).length;

    const [asrAssignments, recentOrders] = await Promise.all([
        territoryIds.length ? prisma.membershipRole.findMany({
            where: {
                role: { code: "ASR" },
                isActive: true,
                startsAt: { lte: now },
                OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                territoryId: { in: territoryIds },
                membership: { organizationId, isActive: true, user: { status: { in: ["ACTIVE", "SUSPENDED", "DISABLED"] } } },
            },
            select: { membership: { select: { userId: true } } },
        }) : Promise.resolve([]),
        distributorIds.length ? prisma.salesOrder.findMany({
            where: {
                organizationId,
                distributorId: { in: distributorIds },
                orderDate: { gte: sevenDaysAgo, lte: now },
                currency: "KES",
                status: { notIn: ["DRAFT", "CANCELLED"] },
            },
            select: { items: { select: { quantity: true, unitPrice: true } } },
        }) : Promise.resolve([]),
    ]);

    const recentTotals = recentOrders.reduce((total, order) => {
        const { revenue, volume } = orderTotals(order.items);
        total.revenue += revenue;
        total.volume += volume;
        return total;
    }, { revenue: 0, volume: 0 });

    return {
        updatedAt: now.toISOString(),
        currency: "KES",
        metrics: {
            totalTerritories: territories.length,
            activeTerritories: territories.filter(({ isActive }) => isActive).length,
            inactiveTerritories: territories.filter(({ isActive }) => !isActive).length,
            newThisMonth: territories.filter(({ createdAt }) => createdAt >= monthStart).length,
            regionsCovered: new Set(territories.map(({ regionId }) => regionId)).size,
            outletsInTerritories: allOutlets.length,
            coolersInTerritories: allOutlets.reduce((total, outlet) => total + outlet.coolerCount, 0),
            activeCoolers: allOutlets.filter(({ isActive }) => isActive).reduce((total, outlet) => total + outlet.coolerCount, 0),
            distributors: distributorIds.length,
            activeDistributors,
            asrs: new Set(asrAssignments.map(({ membership }) => membership.userId)).size,
            routes: null,
            activeRoutes: null,
            ordersLast7Days: recentOrders.length,
            revenueLast7Days: recentTotals.revenue,
            volumeLast7Days: recentTotals.volume,
        },
        regions: regions.map((region) => ({
            id: region.id,
            name: region.name,
            territories: region.territories,
        })),
        territories: territories.map((territory) => ({
            id: territory.id,
            code: territory.shortCode,
            name: territory.name,
            region: territory.region.name,
            isActive: territory.isActive,
        })),
    };
}
