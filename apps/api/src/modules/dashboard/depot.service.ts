import { prisma } from "@salesflow/database";

const DEFAULT_DEPOT_CODE = "HEAD-OFFICE";

// Lazily creates one default Depot per organization, the same pattern already used for the
// "Unassigned" region/territory: MTSR/HORECA orders and outlets need *some* Depot to attach to,
// and there's no Depot management UI yet, so we provide one automatically instead of blocking the
// feature on it. Calling this repeatedly is safe — it only ever creates the depot once per org.
export async function ensureDefaultDepot(organizationId: string) {
    return prisma.depot.upsert({
        where: { organizationId_code: { organizationId, code: DEFAULT_DEPOT_CODE } },
        update: {},
        create: { organizationId, code: DEFAULT_DEPOT_CODE, name: "Head Office Depot" },
        select: { id: true, name: true, code: true },
    });
}

export async function listDepots(organizationId: string) {
    return prisma.depot.findMany({
        where: { organizationId, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
    });
}
