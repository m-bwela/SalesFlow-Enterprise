import { Router } from "express";
import { z } from "zod";
import { Prisma, prisma } from "@salesflow/database";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import { getProductsOverview } from "./product-management.service.js";

const router = Router();
const forbidden = {
    error: {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource."
    }
}
const opt = z.string().trim().optional().transform((v) => v || null);
const schema = z.object({
    name: z.string().trim().min(2),
    sku: z.string().trim().min(1).transform((s) => s.toUpperCase()),
    brand: opt,
    category: opt,
    packSize: opt,
    unitPrice: z.coerce.number().min(0), isActive: z.boolean().default(true),
});

async function audit(res: any, action: string, id: string) {
    await prisma.auditLog.create({
        data: {
            organizationId: res.locals.membership.organizationId,
            actorId: res.locals.user.id,
            action,
            resourceType: "Product",
            resourceId: id,
            requestId: res.locals.requestId
        }
    });
}

const dup = (e: unknown, res: any) =>
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" &&
    res.status(409).json({
        error: {
            code: "CONFLICT",
            message: "A product with this SKU already exists.",
        }
    });

router.get("/", authenticate, requirePermission("dashboard.view"), async (_req, res, next) => {
    try {
        const m = res.locals.membership;
        if (!m) {
            return res.status(403).json(forbidden);
        }
        res.json({
            data: await getProductsOverview(m.organizationId)
        });
    } catch (e) {
        next(e);
    }
});

router.post("/", authenticate, requirePermission("users.update"), async (req, res, next) => {
    try {
        const m = res.locals.membership;
        const user = res.locals.user;
        if (!m || !user) {
            return res.status(403).json(forbidden);
        }
        const p = await prisma.product.create({
            data: {
                ...schema.parse(req.body),
                organizationId: m.organizationId,
            }
        });
        await audit(res, "PRODUCT_CREATED", p.id);
        res.status(201).json({
            data: {
                id: p.id,
            }
        });
    } catch (e) {
        dup(e, res) || next(e);
    }
});

router.put("/:id", authenticate, requirePermission("users.update"), async (req, res, next) => {
    try {
        const m = res.locals.membership;
        const user = res.locals.user;
        if (!m || !user) {
            return res.status(403).json(forbidden);
        }
        const  id  = z.string().uuid().parse(req.params.id);
        const r = await prisma.product.updateMany({
            where: {
                id,
                organizationId: m.organizationId
            },
            data: {
                ...schema.parse(req.body),
            }
        });
        if (!r.count) 
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Product not found.",
                }
            });
        await audit(res, "PRODUCT_UPDATED", id);
        res.json({
            data: {
                id,
            }
        });
    } catch (error) {
        dup(error, res) || next(error);
    }
});

router.patch("/:id/status", authenticate, requirePermission("users.update"), async (req, res, next) => {
    try {
        const m = res.locals.membership;
        const user = res.locals.user;
        if (!m || !user) {
            return res.status(403).json(forbidden);
        }
        const id = z.string().uuid().parse(req.params.id);
        const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
        const r = await prisma.product.updateMany({
            where: {
                id,
                organizationId: m.organizationId
            },
            data: {
                isActive,
            }
        });
        if (!r.count) 
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Product not found.",
                }
            });
        await audit(res, isActive ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED", id);
        res.json({
            data: {
                id,
            }
        });
    } catch (e) {
        next(e);
    }
});

router.delete("/:id", authenticate, requirePermission("users.update"), async (req, res, next) => {
    try {
        const m = res.locals.membership;
        const user = res.locals.user;
        if(!m || !user) return res.status(403).json(forbidden);
        const id = z.string().uuid().parse(req.params.id);
        if (await prisma.salesOrderItem.count(
            {
                where: {
                    productId: id,
                }
            }
        )) {
            return res.status(409).json({
                error: {
                    code: "CONFLICT",
                    message: "This product has order history and can't be deleted. Deactivate it instead.",
                }
            });
        }
        const r = await prisma.product.deleteMany({
            where: {
                id,
                organizationId: m.organizationId
            }
        });
        if (!r.count) 
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Product not found.",
                }
            });
        await audit(res, "PRODUCT_DELETED", id);
        res.json({
            data: {
                id,
            }
        });
    } catch (e) {
        next(e);
    }
});

export default router;