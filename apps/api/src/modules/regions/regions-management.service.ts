import { prisma, Prisma } from "@salesflow/database";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export async function getRegionsOverview(organizationId: string) {
  const d7 = daysAgo(7), d30 = daysAgo(30);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [regions, structure, sales, asrs, newThisMonth] = await Promise.all([
    prisma.region.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.$queryRaw<{ regionId: string; territories: number; distributors: number; outlets: number; coolers: number }[]>(Prisma.sql`
      SELECT r.id AS "regionId", COUNT(DISTINCT t.id)::int AS territories, COUNT(DISTINCT d.id)::int AS distributors,
             COUNT(DISTINCT o.id)::int AS outlets, COALESCE(SUM(o."coolerCount"), 0)::int AS coolers
      FROM regions r
      LEFT JOIN territories t ON t."regionId" = r.id
      LEFT JOIN distributors d ON d."territoryId" = t.id
      LEFT JOIN outlets o ON o."distributorId" = d.id
      WHERE r."organizationId" = ${organizationId}::uuid GROUP BY r.id`),
    prisma.$queryRaw<{ regionId: string; orders7: number; rev7: number; vol7: number; orders30: number; rev30: number }[]>(Prisma.sql`
      SELECT t."regionId" AS "regionId",
        COUNT(DISTINCT so.id) FILTER (WHERE so."orderDate" >= ${d7})::int AS orders7,
        COALESCE(SUM(i.quantity * i."unitPrice") FILTER (WHERE so."orderDate" >= ${d7}), 0)::float AS rev7,
        COALESCE(SUM(i.quantity) FILTER (WHERE so."orderDate" >= ${d7}), 0)::float AS vol7,
        COUNT(DISTINCT so.id)::int AS orders30,
        COALESCE(SUM(i.quantity * i."unitPrice"), 0)::float AS rev30
      FROM sales_orders so
      JOIN outlets o ON o.id = so."outletId"
      JOIN distributors d ON d.id = o."distributorId"
      JOIN territories t ON t.id = d."territoryId"
      LEFT JOIN sales_order_items i ON i."salesOrderId" = so.id
      WHERE so."organizationId" = ${organizationId}::uuid AND so.status <> 'CANCELLED' AND so."orderDate" >= ${d30}
      GROUP BY t."regionId"`),
    prisma.membershipRole.groupBy({
      by: ["regionId"], _count: { _all: true },
      where: { isActive: true, regionId: { not: null }, role: { code: "ASR" }, membership: { organizationId } },
    }),
    prisma.region.count({ where: { organizationId, createdAt: { gte: monthStart } } }),
  ]);

  const st = new Map(structure.map((r) => [r.regionId, r]));
  const sl = new Map(sales.map((r) => [r.regionId, r]));
  const ag = new Map(asrs.map((r) => [r.regionId!, r._count._all]));

  const rows = regions.map((r) => ({
    id: r.id, name: r.name, code: r.code, isActive: r.isActive,
    territories: st.get(r.id)?.territories ?? 0, distributors: st.get(r.id)?.distributors ?? 0,
    outlets: st.get(r.id)?.outlets ?? 0, coolers: st.get(r.id)?.coolers ?? 0, asrs: ag.get(r.id) ?? 0,
    orders30d: sl.get(r.id)?.orders30 ?? 0, revenue30d: sl.get(r.id)?.rev30 ?? 0,
  }));
  const sum = <K extends keyof (typeof rows)[number]>(k: K) => rows.reduce((s, r) => s + Number(r[k]), 0);
  const best = [...rows].sort((a, b) => b.revenue30d - a.revenue30d)[0];

  return {
    updatedAt: new Date(),
    currency: "KES",
    metrics: {
      totalRegions: rows.length, activeRegions: rows.filter((r) => r.isActive).length,
      inactiveRegions: rows.filter((r) => !r.isActive).length, newThisMonth,
      territories: sum("territories"), distributors: sum("distributors"), outlets: sum("outlets"), coolers: sum("coolers"), asrs: sum("asrs"),
      orders7d: sales.reduce((s, r) => s + r.orders7, 0), revenue7d: sales.reduce((s, r) => s + r.rev7, 0),
      volume7d: sales.reduce((s, r) => s + r.vol7, 0),
      bestRegion30d: best && best.revenue30d > 0 ? best.name : null,
    },
    regions: rows,
  };
}