import { prisma, type Prisma } from "@salesflow/database";

const ONLINE_MS = 2 * 60_000;
const EAT_OFFSET = 3 * 3600_000;
const PERIOD_MINUTES: Record<string, number> = {
    LIVE: 1, "1H": 60, "3H": 180, "6H": 360, "1D": 1440, "1W": 10080,
    "2W": 20160, "1M": 43200, "3M": 129600, "6M": 259200, "1Y": 525600,
};

const since = (period: string) =>
    period === "YTD"
        ? new Date(new Date().getFullYear(), 0, 1)
        : new Date(Date.now() - (PERIOD_MINUTES[period] ?? 1) * 60_000);

const startOfTodayEAT = () => {
    const t = new Date(Date.now() + EAT_OFFSET);
    t.setUTCHours(0, 0, 0, 0);
    return new Date(t.getTime() - EAT_OFFSET);
};

export async function getOnlineUsersOverview(organizationId: string, period: string) {
    const inOrg: Prisma.UserWhereInput = {
        memberships: { some: { organizationId } },
        status: { not: "ARCHIVED" },
    };
    const liveWhere: Prisma.UserWhereInput = {
        ...inOrg,
        status: "ACTIVE",
        lastSeenAt: { gte: new Date(Date.now() - ONLINE_MS) },
    };

    const [rows, total, registered, online, active, never, newUsers, top] = await Promise.all([
        prisma.user.findMany({
            where: period === "LIVE" ? liveWhere : { ...inOrg, lastSeenAt: { gte: since(period) } },
            orderBy: { lastSeenAt: "desc" },
            take: 200,
            include: {
                department: true,
                memberships: {
                    where: { organizationId },
                    include: { roles: { where: { isActive: true }, include: { role: true } } },
                },
            },
        }),
        prisma.user.count({ where: inOrg }),
        prisma.user.count({ where: { ...inOrg, status: { notIn: ["PENDING", "ARCHIVED"] } } }),
        prisma.user.count({ where: liveWhere }),
        prisma.user.count({ where: { ...inOrg, status: "ACTIVE", lastSeenAt: { gte: since("1M") } } }),
        prisma.user.count({ where: { ...inOrg, lastLoginAt: null } }),
        prisma.user.count({ where: { ...inOrg, createdAt: { gte: since(period === "LIVE" ? "1D" : period) } } }),
        prisma.loginAttempt.groupBy({
            by: ["userId"],
            where: { successful: true, userId: { not: null }, createdAt: { gte: startOfTodayEAT() } },
            _count: true,
            orderBy: { _count: { userId: "desc" } },
            take: 1,
        }),
    ]);

    const topUser = top[0]?.userId
        ? await prisma.user.findUnique({ where: { id: top[0].userId }, select: { displayName: true } })
        : null;

    return {
        kpis: {
            total, registered, online, active, never, newUsers,
            mostActiveToday: topUser ? { name: topUser.displayName, logins: top[0]._count } : null,
        },
        users: rows.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            email: u.email,
            phoneNumber: u.phoneNumber,
            department: u.department?.name ?? "—",
            role: u.memberships[0]?.roles[0]?.role.code ?? null,
            lastSeenAt: u.lastSeenAt,
            isOnline: u.status === "ACTIVE" && !!u.lastSeenAt && Date.now() - +u.lastSeenAt < ONLINE_MS,
        })),
    };
}