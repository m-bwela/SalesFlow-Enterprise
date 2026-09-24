import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js"
import { requirePermission } from "../auth/authorization.js";
import { getAdminDashboard } from "./dashboard.service.js";

import { z } from "zod";

const router = Router();

const dashboardFilterSchema = z.object({
    period: z.enum([
        "1D",
        "1W",
        "1M",
        "3M",
        "6M",
        "YTD",
        "1Y",
        "ALL",
    ])
    .default("1M"),

    regionId: z.string().uuid().optional(),

    territoryId: z.string().uuid().optional(),

    distributorId: z.string().uuid().optional(),

    asrId: z.string().uuid().optional(),
});

router.get(
    "/admin",
    authenticate,
    requirePermission("dashboard.view"),
    async (req, res, next) => {
        try {
            const filters = dashboardFilterSchema.parse(req.query);

            const dashboard = await getAdminDashboard(filters);

            return res.json({
                data: dashboard,
            });
        } catch (error) {
            next(error);
        }
    },
);

export default router;