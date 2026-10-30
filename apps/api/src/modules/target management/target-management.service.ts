import { prisma, Prisma } from "@salesflow/database";

export type Level = "REGION" | "TERRITORY" | "ASR";

export const monthBounds = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return {
    start: new Date(`${m}-01T00:00:00+03:00`),
    end: new Date(Date.UTC(y!, mo!, 1) - 3 * 3600_000),   // first of next month, Nairobi time
    key: new Date(`${m}-01T00:00:00Z`),
  };
};

type Actual = { revenue: number; volume: number; orders: number; newOutlets: number };
const zero = (): Actual => ({ revenue: 0, volume: 0, orders: 0, newOutlets: 0 });

async function entities(organizationId: string, level: Level) {
  if (level === "REGION") {
    const r = await prisma.region.findMany({ where: { organizationId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
    return r.map((x) => ({ id: x.id, name: x.name, parent: null as string | null }));
  }
  if (level === "TERRITORY") {
    const t = await prisma.territory.findMany({ where: { organizationId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, region: { select: { name: true } } } });
    return t.map((x) => ({ id: x.id, name: x.name, parent: x.region.name }));
  }
  const u = await prisma.user.findMany({
    where: { status: "ACTIVE", memberships: { some: { organizationId, roles: { some: { isActive: true, role: { code: "ASR" } } } } } },
    orderBy: { displayName: "asc" }, select: { id: true, displayName: true },
  });
  return u.map((x) => ({ id: x.id, name: x.displayName, parent: null as string | null }));
}

async function actuals(organizationId: string, level: Level, start: Date, end: Date) {
  const orderKey = Prisma.raw(level === "REGION" ? `t."regionId"` : level === "TERRITORY" ? `d."territoryId"` : `so."createdById"`);
  const outletKey = Prisma.raw(level === "REGION" ? `t."regionId"` : level === "TERRITORY" ? `d."territoryId"` : `o."createdById"`);
  const [orders, outlets] = await Promise.all([
    prisma.$queryRaw<{ id: string; orders: number; revenue: number; volume: number }[]>(Prisma.sql`
      SELECT ${orderKey} AS id, COUNT(DISTINCT so.id)::int AS orders,
             COALESCE(SUM(i.quantity * i."unitPrice"), 0)::float AS revenue, COALESCE(SUM(i.quantity), 0)::float AS volume
      FROM sales_orders so
      JOIN outlets o ON o.id = so."outletId"
      LEFT JOIN distributors d ON d.id = o."distributorId"
      LEFT JOIN territories t ON t.id = d."territoryId"
      LEFT JOIN sales_order_items i ON i."salesOrderId" = so.id
      WHERE so."organizationId" = ${organizationId}::uuid AND so.status <> 'CANCELLED'
        AND so."orderDate" >= ${start} AND so."orderDate" < ${end} AND ${orderKey} IS NOT NULL
      GROUP BY 1`),
    prisma.$queryRaw<{ id: string; n: number }[]>(Prisma.sql`
      SELECT ${outletKey} AS id, COUNT(DISTINCT o.id)::int AS n
      FROM outlets o
      LEFT JOIN distributors d ON d.id = o."distributorId"
      LEFT JOIN territories t ON t.id = d."territoryId"
      WHERE o."organizationId" = ${organizationId}::uuid AND o."createdAt" >= ${start} AND o."createdAt" < ${end} AND ${outletKey} IS NOT NULL
      GROUP BY 1`),
  ]);
  const map = new Map<string, Actual>();
  orders.forEach((r) => map.set(r.id, { ...zero(), revenue: r.revenue, volume: r.volume, orders: r.orders }));
  outlets.forEach((r) => map.set(r.id, { ...(map.get(r.id) ?? zero()), newOutlets: r.n }));
  return map;
}

export async function getTargets(organizationId: string, level: Level, month: string) {
  const { start, end, key } = monthBounds(month);
  const [list, targets, act] = await Promise.all([
    entities(organizationId, level),
    prisma.target.findMany({ where: { organizationId, level, month: key } }),
    actuals(organizationId, level, start, end),
  ]);
  const tg = new Map(targets.map((t) => [t.entityId, t]));
  return {
    month, level, updatedAt: new Date(),
    rows: list.map((e) => {
      const t = tg.get(e.id);
      return {
        id: e.id, name: e.name, parent: e.parent, hasTarget: !!t,
        target: { revenue: Number(t?.revenue ?? 0), volume: Number(t?.volume ?? 0), orders: t?.orders ?? 0, newOutlets: t?.newOutlets ?? 0 },
        actual: act.get(e.id) ?? zero(),
      };
    }),
  };
}

export async function entityExists(organizationId: string, level: Level, id: string) {
  if (level === "REGION") return !!(await prisma.region.findFirst({ where: { id, organizationId }, select: { id: true } }));
  if (level === "TERRITORY") return !!(await prisma.territory.findFirst({ where: { id, organizationId }, select: { id: true } }));
  return !!(await prisma.user.findFirst({ where: { id, memberships: { some: { organizationId } } }, select: { id: true } }));
}