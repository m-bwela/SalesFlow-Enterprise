import { Router } from "express";
import { prisma } from "@salesflow/database";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    next(error);
  }
});
