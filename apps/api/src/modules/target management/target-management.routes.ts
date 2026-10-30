import { Router } from "express";
import { z } from "zod";
import { prisma } from "@salesflow/database";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { entityExists, getTargets, monthBounds } from "./target-management.service.js";

const router = Router();
const forbidden = { error: { code: "FORBIDDEN", message: "No active organization membership found." } };
const WRITE = "users.update"; // switch to a dedicated "targets.manage" permission later
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const level = z.enum(["REGION", "TERRITORY", "ASR"]);

router.get("/", authenticate, requirePermission("dashboard.view"), async (req, res, next) => {
  try {
    const m = res.locals.membership;
    if (!m) return res.status(403).json(forbidden);
    const q = z.object({ level, month }).parse(req.query);
    res.json({ data: await getTargets(m.organizationId, q.level, q.month) });
  } catch (e) { next(e); }
});

router.put("/", authenticate, requirePermission(WRITE), async (req, res, next) => {
  try {
    const m = res.locals.membership, user = res.locals.user;
    if (!m || !user) return res.status(403).json(forbidden);
    const b = z.object({
      level, month, entityId: z.string().uuid(),
      revenue: z.coerce.number().min(0), volume: z.coerce.number().min(0),
      orders: z.coerce.number().int().min(0), newOutlets: z.coerce.number().int().min(0),
    }).parse(req.body);
    if (!(await entityExists(m.organizationId, b.level, b.entityId)))
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "That region, territory or agent was not found." } });

    const key = monthBounds(b.month).key;
    const data = { revenue: b.revenue, volume: b.volume, orders: b.orders, newOutlets: b.newOutlets, setById: user.id };
    await prisma.target.upsert({
      where: { organizationId_level_entityId_month: { organizationId: m.organizationId, level: b.level, entityId: b.entityId, month: key } },
      update: data, create: { ...data, organizationId: m.organizationId, level: b.level, entityId: b.entityId, month: key },
    });
    await prisma.auditLog.create({ data: { organizationId: m.organizationId, actorId: user.id, action: "TARGET_SET", resourceType: "Target", resourceId: b.entityId, requestId: res.locals.requestId, metadata: { level: b.level, month: b.month, ...data } } });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
});

router.post("/copy", authenticate, requirePermission(WRITE), async (req, res, next) => {
  try {
    const m = res.locals.membership, user = res.locals.user;
    if (!m || !user) return res.status(403).json(forbidden);
    const b = z.object({ level, fromMonth: month, toMonth: month }).parse(req.body);
    const from = await prisma.target.findMany({ where: { organizationId: m.organizationId, level: b.level, month: monthBounds(b.fromMonth).key } });
    const r = await prisma.target.createMany({
      skipDuplicates: true,   // never overwrite targets that are already set
      data: from.map((t) => ({ organizationId: t.organizationId, level: t.level, entityId: t.entityId, month: monthBounds(b.toMonth).key, revenue: t.revenue, volume: t.volume, orders: t.orders, newOutlets: t.newOutlets, setById: user.id })),
    });
    await prisma.auditLog.create({ data: { organizationId: m.organizationId, actorId: user.id, action: "TARGETS_COPIED", resourceType: "Target", requestId: res.locals.requestId, metadata: { ...b, copied: r.count } } });
    res.json({ data: { copied: r.count } });
  } catch (e) { next(e); }
});

export default router;