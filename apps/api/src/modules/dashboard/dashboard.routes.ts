import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js"
import { requirePermission } from "../auth/authorization.js";
import { getAdminDashboard } from "./dashboard.service.js";

const router = Router();

router.get(
    "/admin",
    authenticate,
    requirePermission("dashboard.view"),
    async (_req, res, next) => {
        try {
            const dashboard = await getAdminDashboard();

            return res.json({
                data: dashboard,
            });
        } catch (error) {
            next(error);
        }
    },
);

export default router;