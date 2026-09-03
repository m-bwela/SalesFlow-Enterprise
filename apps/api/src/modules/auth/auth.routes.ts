import { Router } from "express";

import { register, login } from "./auth.controller.js";

import { requireAuth } from "./auth.middleware.js";

import { getCurrentUser } from "./auth.me.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, getCurrentUser);