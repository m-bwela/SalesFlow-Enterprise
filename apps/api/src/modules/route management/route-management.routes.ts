import { Router } from 'express';
import { z } from 'zod';
import { Prisma, prisma } from '@salesflow/database';
import  { authenticate } from '../auth/auth.middleware.js';
import  { requirePermission } from '../auth/authorization.js';
import { getRoutesOverview } from './route-management.service.js';

const router = Router();
const forbidden = { error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } };

router.get("/", authenticate, requirePermission("dashboard.view"), async (_req, res, next) => {
    try {
        const m = res.locals.membership;
        if (!m) {
            return res.status(403).json(forbidden);
        }

        res.json({ data: await getRoutesOverview(m.organizationId) });
    } catch (e) {
        next(e);
    }
});

const createSchema = z.object({
    name: z.string().trim().min(2), code: z.string().trim().min(2).max(20).transform((s) => s.toUpperCase()),
    territoryId: z.string().uuid().nullable().optional(), agentId: z.string().uuid().nullable().optional(),
    frequency: z.enum(["WEEKLY", "MONTHLY"]).default("WEEKLY"),
});

router.post("/", authenticate, requirePermission("users.update"), async (req, res, next) => {
    try {
        const m = res.locals.membership;
        if (!m) {
            return res.status(403).json(forbidden);
        }

        const d = createSchema.parse(req.body);
        const route = await prisma.route.create({
            data: {
                ...d,
                organizationId: m.organizationId,
            },
        });
        await prisma.auditLog.create({
            data: {
                organizationId: m.organizationId,
                actorId: res.locals.user.id,
                action: "ROUTE_CREATED",
                resourceType: "ROUTE",
                resourceId: route.id,
                requestId: res.locals.requestId,
            },
        });

        res.status(201).json({ data: route });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({
                error: {
                    code: "CONFLICT",
                    message: "A route with this code already exists."
                },
            });
        }
        next(e);
    }
});

export default router;