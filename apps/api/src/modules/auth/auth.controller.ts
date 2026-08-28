import type { Request, Response, NextFunction } from "express";

import { registerSchema } from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export async function register(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const input = registerSchema.parse(req.body);

        const user = await authService.register(input);
        res.status(201).json({
            user,
        });
    } catch (error) {
        next(error);
    }
}