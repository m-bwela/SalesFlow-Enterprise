import { Router } from "express";
import { z } from "zod";
import { Prisma, prisma } from "@salesflow/database";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { getRegionsOverview } from "./regions-management.service.js";

const router = Router();
const forbidden = { error: { code: "FORBIDDEN", message: "No active organization membership found." } };
const WRITE = "users.update"; // use the same permission your territories routes use

const initials = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w.map((x) => x[0]!.toUpperCase()).join("") : (w[0] ?? "").slice(0, 2).toUpperCase()) || "RG";
};
async function audit(res: any, action: string, id: string) {
  await prisma.auditLog.create({ data: { organizationId: res.locals.membership.organizationId, actorId: res.locals.user.id, action, resourceType: "Region", resourceId: id, requestId: res.locals.requestId } });
}

router.get("/", authenticate, requirePermission("dashboard.view"), async (_req, res, next) => {
  try {
    const m = res.locals.membership;
    if (!m) return res.status(403).json(forbidden);
    res.json({ data: await getRegionsOverview(m.organizationId) });
  } catch (e) { next(e); }
});

router.post("/", authenticate, requirePermission(WRITE), async (req, res, next) => {
  try {
    const m = res.locals.membership, user = res.locals.user;
    if (!m || !user) return res.status(403).json(forbidden);
    const { name } = z.object({ name: z.string().trim().min(2) }).parse(req.body);
    if (await prisma.region.findFirst({ where: { organizationId: m.organizationId, name: { equals: name, mode: "insensitive" } } }))
      return res.status(409).json({ error: { code: "CONFLICT", message: "A region with this name already exists." } });

    const base = initials(name);
    for (let n = 1; n <= 20; n++) {            // retry on a code collision (codes are unique database-wide)
      const code = n === 1 ? base : `${base}${n}`;
      try {
        const region = await prisma.region.create({ data: { organizationId: m.organizationId, name, code } });
        await audit(res, "REGION_CREATED", region.id);
        return res.status(201).json({ data: { id: region.id, name: region.name, code } });
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      }
    }
    return res.status(409).json({ error: { code: "CONFLICT", message: "Could not generate a unique region code." } });
  } catch (e) { next(e); }
});

router.patch("/:id/status", authenticate, requirePermission(WRITE), async (req, res, next) => {
  try {
    const m = res.locals.membership, user = res.locals.user;
    if (!m || !user) return res.status(403).json(forbidden);
    const id = z.string().uuid().parse(req.params.id);
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const r = await prisma.region.updateMany({ where: { id, organizationId: m.organizationId }, data: { isActive } });
    if (!r.count) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Region not found." } });
    await audit(res, isActive ? "REGION_ACTIVATED" : "REGION_DEACTIVATED", id);
    res.json({ data: { id } });
  } catch (e) { next(e); }
});

router.delete("/:id", authenticate, requirePermission(WRITE), async (req, res, next) => {
  try {
    const m = res.locals.membership, user = res.locals.user;
    if (!m || !user) return res.status(403).json(forbidden);
    const id = z.string().uuid().parse(req.params.id);
    if (await prisma.territory.count({ where: { regionId: id } }))
      return res.status(409).json({ error: { code: "CONFLICT", message: "This region still has territories. Move or delete them first, or deactivate the region." } });
    const r = await prisma.region.deleteMany({ where: { id, organizationId: m.organizationId } });
    if (!r.count) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Region not found." } });
    await audit(res, "REGION_DELETED", id);
    res.json({ data: { id } });
  } catch (e) { next(e); }
});

export default router;