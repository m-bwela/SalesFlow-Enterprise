import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js"
import { requirePermission } from "../auth/authorization.js";
import { getAdminDashboard, getAsrDashboard, getTsmDashboard } from "./dashboard.service.js";

import { z } from "zod";

const router = Router();

const dashboardFilterSchema = z.object({
    period: z.enum([
        "LIVE",
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

const asrDashboardPeriodSchema = z.enum([
    "TODAY",
    "YESTERDAY",
    "THIS_WEEK",
    "LAST_WEEK",
    "TWO_WEEKS_BACK",
    "THIS_MONTH",
    "ALL",
]).default("TODAY");

const tsmDashboardFilterSchema = z.object({
    period: z.enum(["TODAY", "YESTERDAY", "THIS_WEEK", "LAST_WEEK", "THIS_MONTH", "ALL"]).default("THIS_WEEK"),
    regionId: z.string().uuid().optional(),
    territoryId: z.string().uuid().optional(),
});

router.get(
    "/tsm",
    authenticate,
    requirePermission("dashboard.view"),
    async (req, res, next) => {
        try {
            const membership = res.locals.membership;
            if (!membership) {
                return res.status(403).json({
                    error: { code: "FORBIDDEN", message: "No active organization membership found." },
                });
            }

            const filters = tsmDashboardFilterSchema.parse(req.query);
            const dashboard = await getTsmDashboard(membership.organizationId, filters);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/asr",
    authenticate,
    requirePermission("dashboard.view"),
    async (req, res, next) => {
        try {
            const period = asrDashboardPeriodSchema.parse(req.query.period);
            const dashboard = await getAsrDashboard(period);

            return res.json({ data: dashboard });
        } catch (error) {
            next(error);
        }
    },
);

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