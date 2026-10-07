import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { AppError } from "../../errors/app-error.js";
import { createOrCodeTerritory, deleteTerritory, getTerritoriesOverview, setTerritoryStatus } from "./territories.service.js";

const router = Router();

const createSchema = z.object({
    regionId: z.string().uuid(),
    territoryId: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(80).optional(),
});

const statusSchema = z.object({ isActive: z.boolean() });
const idSchema = z.string().uuid();

function getOrganizationId(res: import("express").Response) {
    const organizationId = res.locals.membership?.organizationId;
    if (!organizationId) throw new AppError("ORGANIZATION_REQUIRED", 403, "An active organization membership is required.");
    return organizationId;
}

router.use(authenticate);

router.get("/", requirePermission("users.view"), async (_req, res, next) => {
    try {
        const data = await getTerritoriesOverview(getOrganizationId(res));
        return res.json({ data });
    } catch (error) {
        return next(error);
    }
});

router.post("/", requirePermission("users.create"), async (req, res, next) => {
    try {
        const input = createSchema.parse(req.body);
        const territory = await createOrCodeTerritory(getOrganizationId(res), input);
        return res.status(201).json({ data: territory });
    } catch (error) {
        return next(error);
    }
});

router.patch("/:territoryId/status", requirePermission("users.update"), async (req, res, next) => {
    try {
        const territoryId = idSchema.parse(req.params.territoryId);
        const { isActive } = statusSchema.parse(req.body);
        const territory = await setTerritoryStatus(territoryId, getOrganizationId(res), isActive);
        return res.json({ data: territory });
    } catch (error) {
        return next(error);
    }
});

router.delete("/:territoryId", requirePermission("users.update"), async (req, res, next) => {
    try {
        const territoryId = idSchema.parse(req.params.territoryId);
        const result = await deleteTerritory(territoryId, getOrganizationId(res));
        return res.json({ data: result });
    } catch (error) {
        return next(error);
    }
});

export default router;
