import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { getOrganizationFilters } from "./organization.service.js";

const router = Router();

router.get(
    "/filters",
    authenticate,
    requirePermission("dashboard.view"),
    async (_req, res, next) => {
        try {
            const membership = res.locals.membership;

            if (!membership) {
                return res.status(403).json({
                    error: {
                        code: "FORBIDDEN",
                        message: "No active organization membership found."
                    },
                });
            }

            const regions = await getOrganizationFilters(membership.organizationId);

            return res.json({
                data: regions,
            })
        } catch (error) {
            next(error);
        }
    },
);

export default router;