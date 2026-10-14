import { Router, type Request, type RequestHandler, type Response } from "express";
import { Prisma, type PaymentMethodCode } from "@salesflow/database";
import { PAYMENT_CODES } from "../payment-methods/payment-methods.js";
import { z } from "zod";
import { requirePermission } from "../auth/authorization.js" // TODO: your existing permission guard
import * as service from "./payment-methods.service.js"
import { HttpError } from "./payment-methods.service.js";
import { moveSchema, updateMethodSchema, type Actor } from "./payment-methods.types.js";

type AuthedRequest = Request & { user: Actor };
type Handler = (req: AuthedRequest, res: Response) => Promise<void>;

// Express 4 doesn't catch async errors, so map them to JSON here.
// If your errors/ folder already has a central handler, call next(e) instead.
const wrap = (fn: Handler): RequestHandler => (req, res) => {
  fn(req as AuthedRequest, res).catch((e: unknown) => {
    if (e instanceof HttpError) return void res.status(e.status).json({ error: { code: "PAYMENT_METHOD_ERROR", message: e.message } });
    if (e instanceof z.ZodError) return void res.status(400).json({ error: { code: "VALIDATION_ERROR", message: e.issues[0]?.message ?? "Invalid request" } });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return void res.status(409).json({ error: { code: "DUPLICATE", message: "That payment method already exists" } });
    console.error(e);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Server error" } });
  });
};

const parseCode = (v: unknown): PaymentMethodCode => {
  if (!PAYMENT_CODES.includes(v as PaymentMethodCode)) throw new HttpError(400, "Unknown payment code");
  return v as PaymentMethodCode;
};

const view = requirePermission("payments.view");
const manage = requirePermission("payments.manage");

export const paymentMethodsRouter = Router();

paymentMethodsRouter.get("/", view, wrap(async (req, res) => {
  res.json(await service.listMethods(req.user.organizationId));
}));

paymentMethodsRouter.get("/audit", view, wrap(async (req, res) => {
  const code = req.query.code ? parseCode(req.query.code) : undefined;
  res.json(await service.listAudit(req.user.organizationId, code));
}));

paymentMethodsRouter.post("/", manage, wrap(async (req, res) => {
  res.status(201).json(await service.addMethod(req.user, parseCode(req.body?.code)));
}));

paymentMethodsRouter.patch("/:code", manage, wrap(async (req, res) => {
  res.json(await service.updateMethod(req.user, parseCode(req.params.code), updateMethodSchema.parse(req.body)));
}));

paymentMethodsRouter.post("/:code/move", manage, wrap(async (req, res) => {
  res.json(await service.moveMethod(req.user, parseCode(req.params.code), moveSchema.parse(req.body).direction));
}));

paymentMethodsRouter.delete("/:code", manage, wrap(async (req, res) => {
  res.json(await service.deleteMethod(req.user, parseCode(req.params.code)));
}));