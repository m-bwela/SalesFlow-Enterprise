import { Router } from "express";
import { z } from "zod";
import { Prisma, prisma } from "@salesflow/database";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";

const router = Router();
const PAGE = 25;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const schema = z.object({
  search: z.string().trim().optional(), action: z.string().optional(), resourceType: z.string().optional(),
  from: day, to: day, page: z.coerce.number().int().min(1).default(1),
});
const eat = (d: string, end = false) => new Date(`${d}T${end ? "23:59:59.999" : "00:00:00"}+03:00`);

// Use a dedicated "audit.view" permission once you add one
router.get("/", authenticate, requirePermission("users.update"), async (req, res, next) => {
  try {
    const m = res.locals.membership;
    if (!m) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No active organization membership found." } });
    const q = schema.parse(req.query);
    const org = { organizationId: m.organizationId };
    const where: Prisma.AuditLogWhereInput = {
      ...org,
      ...(q.action && { action: q.action }),
      ...(q.resourceType && { resourceType: { equals: q.resourceType, mode: "insensitive" } }),
      ...((q.from || q.to) && { createdAt: { ...(q.from && { gte: eat(q.from) }), ...(q.to && { lte: eat(q.to, true) }) } }),
      ...(q.search && { OR: [
        { action: { contains: q.search, mode: "insensitive" } },
        { resourceId: { contains: q.search, mode: "insensitive" } },
        { actor: { displayName: { contains: q.search, mode: "insensitive" } } },
      ] }),
    };
    const today = new Date(Date.now() + 3 * 3600_000); today.setUTCHours(0, 0, 0, 0);
    const startToday = new Date(today.getTime() - 3 * 3600_000), d7 = new Date(Date.now() - 7 * 86_400_000);

    const [rows, total, actions, types, todayCount, weekCount, actors] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * PAGE, take: PAGE, include: { actor: { select: { displayName: true } } } }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where: org, distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
      prisma.auditLog.findMany({ where: { ...org, resourceType: { not: null } }, distinct: ["resourceType"], select: { resourceType: true } }),
      prisma.auditLog.count({ where: { ...org, createdAt: { gte: startToday } } }),
      prisma.auditLog.count({ where: { ...org, createdAt: { gte: d7 } } }),
      prisma.auditLog.groupBy({ by: ["actorId"], where: { ...org, createdAt: { gte: d7 }, actorId: { not: null } } }),
    ]);

    res.json({ data: {
      rows: rows.map((r) => ({ id: r.id, action: r.action, resourceType: r.resourceType, resourceId: r.resourceId, actor: r.actor?.displayName ?? "System", metadata: r.metadata, requestId: r.requestId, createdAt: r.createdAt })),
      total, page: q.page, pageSize: PAGE,
      actions: actions.map((a) => a.action),
      resourceTypes: [...new Set(types.map((t) => t.resourceType!.toLowerCase()))].sort(),
      stats: { today: todayCount, week: weekCount, actors: actors.length },
    } });
  } catch (e) { 
    next(e); 
    }
});

export default router;