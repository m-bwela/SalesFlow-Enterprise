import { Router } from "express";

import { register, login, getPortal } from "./auth.controller.js";

import { requireAuth } from "./auth.middleware.js";

import { logout } from "./logout.js";

import { getCurrentUser } from "./auth.me.js";
import { getAuthContext } from "./auth.context.js";
import { requirePermission } from "./authorization.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, getCurrentUser);
authRouter.get("/context", requireAuth, getAuthContext);
authRouter.get(
    "/portal",
    requireAuth,
    requirePermission("dashboard.view"),
    getPortal,
);
