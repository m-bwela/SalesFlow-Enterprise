import { Router } from "express";

import { register } from "./auth.controller.js";

import { requireAuth } from "./auth.middleware.js";

import { getCurrentUser } from "./auth.me.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.get("/me", requireAuth, getCurrentUser);