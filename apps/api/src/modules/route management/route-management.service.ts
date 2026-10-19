import { prisma, Prisma } from "@salesflow/database";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const startOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
const eatDay = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

type Agg = { orders: number; revenue: number };

export async function getRoutesOverview(organizationId: string) {
  const d7 = daysAgo(7), d30 = daysAgo(30);
  const org = { organizationId };
  const onRoutes = Prisma.sql`FROM sales_orders so
    JOIN outlets o ON o.id = so."outletId" AND o."routeId" IS NOT NULL
    LEFT JOIN sales_order_items i ON i."salesOrderId" = so.id`;
  const live = (since: Date) => Prisma.sql`WHERE so."organizationId" = ${organizationId}::uuid
    AND so.status <> 'CANCELLED' AND so."orderDate" >= ${since}`;

  const [total, active, weekly, monthly, withAgent, outlets, terr, newMonth, routes, territories, agents, daily, perRoute, week, bestAgent] =
    await Promise.all([
      prisma.route.count({ where: org }),
      prisma.route.count({ where: { ...org, isActive: true } }),
      prisma.route.count({ where: { ...org, frequency: "WEEKLY" } }),
      prisma.route.count({ where: { ...org, frequency: "MONTHLY" } }),
      prisma.route.count({ where: { ...org, agentId: { not: null } } }),
      prisma.outlet.count({ where: { ...org, routeId: { not: null } } }),
      prisma.route.groupBy({ by: ["territoryId"], where: { ...org, territoryId: { not: null } } }),
      prisma.route.count({ where: { ...org, createdAt: { gte: startOfMonth() } } }),
      prisma.route.findMany({
        where: org, orderBy: { name: "asc" }, take: 500,
        include: { territory: { select: { id: true, name: true } }, agent: { select: { displayName: true } }, _count: { select: { outlets: true } } },
      }),
      prisma.territory.findMany({ where: org, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { status: "ACTIVE", memberships: { some: { organizationId, roles: { some: { isActive: true, role: { code: "ASR" } } } } } },
        select: { id: true, displayName: true }, orderBy: { displayName: "asc" },
      }),
      prisma.$queryRaw<(Agg & { day: string })[]>(Prisma.sql`
        SELECT to_char(so."orderDate" AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') AS day,
               COUNT(DISTINCT so.id)::int AS orders, COALESCE(SUM(i.quantity * i."unitPrice"), 0)::float AS revenue
        ${onRoutes} ${live(d30)} GROUP BY 1`),
      prisma.$queryRaw<(Agg & { routeId: string; name: string })[]>(Prisma.sql`
        SELECT r.id AS "routeId", r.name, COUNT(DISTINCT so.id)::int AS orders,
               COALESCE(SUM(i.quantity * i."unitPrice"), 0)::float AS revenue
        FROM routes r
        JOIN outlets o ON o."routeId" = r.id
        JOIN sales_orders so ON so."outletId" = o.id AND so.status <> 'CANCELLED' AND so."orderDate" >= ${d30}
        LEFT JOIN sales_order_items i ON i."salesOrderId" = so.id
        WHERE r."organizationId" = ${organizationId}::uuid GROUP BY r.id, r.name`),
      prisma.$queryRaw<{ orders: number; revenue: number; volume: number; agents: number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT so.id)::int AS orders, COALESCE(SUM(i.quantity * i."unitPrice"), 0)::float AS revenue,
               COALESCE(SUM(i.quantity), 0)::float AS volume, COUNT(DISTINCT so."createdById")::int AS agents
        ${onRoutes} ${live(d7)}`),
      prisma.$queryRaw<{ name: string }[]>(Prisma.sql`
        SELECT u."displayName" AS name
        ${onRoutes} JOIN users u ON u.id = so."createdById" ${live(d30)}
        GROUP BY u.id, u."displayName" ORDER BY SUM(i.quantity * i."unitPrice") DESC NULLS LAST LIMIT 1`),
    ]);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const trend = Array.from({ length: 30 }, (_, k) => {
    const day = eatDay(Date.now() - (29 - k) * 86_400_000);
    return { day, orders: byDay.get(day)?.orders ?? 0, revenue: byDay.get(day)?.revenue ?? 0 };
  });
  const stats30 = new Map(perRoute.map((r) => [r.routeId, r]));
  const topRoutes = [...perRoute].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const revenue30 = trend.reduce((s, d) => s + d.revenue, 0);
  const orders30 = trend.reduce((s, d) => s + d.orders, 0);
  const w = week[0] ?? { orders: 0, revenue: 0, volume: 0, agents: 0 };

  return {
    updatedAt: new Date(),
    stats: {
      total, active, inactive: total - active, weekly, monthly, withAgent, unassigned: total - withAgent,
      outletsOnRoutes: outlets, avgOutletsPerRoute: total ? outlets / total : 0, territoriesCovered: terr.length, newThisMonth: newMonth,
      orders7d: w.orders, revenue7d: w.revenue, volume7d: w.volume, activeAgents7d: w.agents,
      avgRevenuePerRoute30d: active ? revenue30 / active : 0, avgOrdersPerRoute30d: active ? orders30 / active : 0,
      bestRoute30d: topRoutes[0]?.name ?? null, bestAgent30d: bestAgent[0]?.name ?? null, totalRevenue30d: revenue30,
    },
    trend, topRoutes,
    routes: routes.map((r) => ({
      id: r.id, code: r.code, name: r.name, frequency: r.frequency, isActive: r.isActive,
      territoryId: r.territory?.id ?? null, territory: r.territory?.name ?? null, agent: r.agent?.displayName ?? null,
      outlets: r._count.outlets, orders30d: stats30.get(r.id)?.orders ?? 0, revenue30d: stats30.get(r.id)?.revenue ?? 0,
    })),
    territories, agents,
  };
}