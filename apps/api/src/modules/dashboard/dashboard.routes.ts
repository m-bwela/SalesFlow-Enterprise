import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js"
import { requirePermission } from "../auth/authorization.js";
import { getAdminDashboard, getAsrDashboard, getDistributorDashboard, getOutletDashboard, getTsmDashboard } from "./dashboard.service.js";
import { getModernTradeDashboard, getHorecaDashboard } from "./modern-trade.service.js";
import { getMtTsmDashboard, reviewInvoice } from "./mt-tsm.service.js";
import { getOrderAnalyticsOverview, getAgentPerformanceForDay } from "./order-analytics.service.js";

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

const distributorDashboardFilterSchema = z.object({
    period: z.enum(["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"]).default("1M"),
});

const repChannelFilterSchema = z.object({
    period: z.enum(["LIVE", "1H", "3H", "6H", "1D", "1W", "2W", "1M", "3M", "6M", "YTD", "1Y", "2Y", "3Y", "ALL"]).default("1M"),
    regionId: z.string().uuid().optional(),
    territoryId: z.string().uuid().optional(),
    repId: z.string().uuid().optional(),
});

const mtTsmFilterSchema = z.object({
    period: z.enum(["LIVE", "1H", "3H", "6H", "1D", "1W", "2W", "1M", "3M", "6M", "YTD", "1Y"]).default("1M"),
    regionId: z.string().uuid().optional(),
    territoryId: z.string().uuid().optional(),
    mtTsmId: z.string().uuid().optional(),
});

const invoiceActionSchema = z.object({
    action: z.enum(["APPROVE", "REJECT"]),
});

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format.");

const orderAnalyticsFilterSchema = z.object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    regionId: z.string().uuid().optional(),
    territoryId: z.string().uuid().optional(),
    agentId: z.string().uuid().optional(),
    granularity: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
});

const agentPerformanceFilterSchema = z.object({
    date: dateStringSchema,
});

router.get(
    "/order-analytics",
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

            const filters = orderAnalyticsFilterSchema.parse(req.query);
            const dashboard = await getOrderAnalyticsOverview(membership.organizationId, filters);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/order-analytics/agent-performance",
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

            const { date } = agentPerformanceFilterSchema.parse(req.query);
            const result = await getAgentPerformanceForDay(membership.organizationId, date);
            return res.json({ data: result });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/modern-trade",
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

            const filters = repChannelFilterSchema.parse(req.query);
            const dashboard = await getModernTradeDashboard(membership.organizationId, filters);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/horeca",
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

            const filters = repChannelFilterSchema.parse(req.query);
            const dashboard = await getHorecaDashboard(membership.organizationId, filters);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/mt-tsm",
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

            const filters = mtTsmFilterSchema.parse(req.query);
            const dashboard = await getMtTsmDashboard(membership.organizationId, filters);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.patch(
    "/invoices/:orderId",
    authenticate,
    requirePermission("users.update"),
    async (req, res, next) => {
        try {
            const membership = res.locals.membership;
            const user = res.locals.user;
            if (!membership || !user) {
                return res.status(403).json({
                    error: { code: "FORBIDDEN", message: "No active organization membership found." },
                });
            }

            const orderId = z.string().uuid().parse(req.params.orderId);
            const { action } = invoiceActionSchema.parse(req.body);
            const result = await reviewInvoice(membership.organizationId, orderId, user.id, action);
            return res.json({ data: result });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/distributors",
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

            const filters = distributorDashboardFilterSchema.parse(req.query);
            const dashboard = await getDistributorDashboard(membership.organizationId, filters.period);
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

router.get(
    "/outlets",
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

            const filters = dashboardFilterSchema.parse(req.query);
            const dashboard = await getOutletDashboard(membership.organizationId, { period: filters.period });
            return res.json({ data: dashboard });
        } catch (error) {
            return next(error);
        }
    },
);

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