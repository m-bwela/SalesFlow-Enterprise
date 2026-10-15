import { Router, type Request, type RequestHandler, type Response } from "express";
import { Prisma, type PaymentMethodCode } from "@salesflow/database";
import { PAYMENT_CODES } from "@salesflow/shared";

import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";
import * as service from "./payment-methods.service.js";
import { HttpError } from "./payment-methods.service.js";
import { moveSchema, updateMethodSchema, type Actor } from "./payment-methods.types.js";

const router = Router();

const view = [authenticate, requirePermission("payments.view")];
const manage = [authenticate, requirePermission("payments.manage")];

// authenticate puts the user and active membership in res.locals (same as dashboard.routes.ts).
function getActor(res: Response): Actor | null {
    const { membership, user } = res.locals;
    if (!membership || !user) return null;
    return {
        id: user.id,
        name: user.displayName ?? user.email ?? "Unknown",
        organizationId: membership.organizationId,
    };
}

const parseCode = (value: unknown): PaymentMethodCode => {
    if (!PAYMENT_CODES.includes(value as PaymentMethodCode)) {
        throw new HttpError(400, "Unknown payment code");
    }
    return value as PaymentMethodCode;
};

// Wraps a handler: resolves the actor, answers { data }, and maps known errors to { error: { code, message } }.
// Anything else (e.g. ZodError) goes to next(), like the dashboard routes.
const handle = (
    fn: (actor: Actor, req: Request) => Promise<unknown>,
    status = 200,
): RequestHandler => async (req, res, next) => {
    try {
        const actor = getActor(res);
        if (!actor) {
            return res.status(403).json({
                error: { code: "FORBIDDEN", message: "No active organization membership found." },
            });
        }
        return res.status(status).json({ data: await fn(actor, req) });
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: { code: "PAYMENT_METHOD_ERROR", message: error.message } });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return res.status(409).json({ error: { code: "DUPLICATE", message: "That payment method already exists." } });
        }
        return next(error);
    }
};

router.get("/", ...view, handle(actor => service.listMethods(actor.organizationId)));

router.get("/audit", ...view, handle(async (actor, req) => {
    const code = req.query.code ? parseCode(req.query.code) : undefined;
    return service.listAudit(actor.organizationId, code);
}));

router.post("/", ...manage, handle(
    (actor, req) => service.addMethod(actor, parseCode(req.body?.code)),
    201,
));

router.patch("/:code", ...manage, handle(
    (actor, req) => service.updateMethod(actor, parseCode(req.params.code), updateMethodSchema.parse(req.body)),
));

router.post("/:code/move", ...manage, handle(
    (actor, req) => service.moveMethod(actor, parseCode(req.params.code), moveSchema.parse(req.body).direction),
));

router.delete("/:code", ...manage, handle(
    (actor, req) => service.deleteMethod(actor, parseCode(req.params.code)),
));

export default router;