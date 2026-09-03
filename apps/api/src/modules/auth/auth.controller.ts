import type { Request, Response, NextFunction } from "express";

import { registerSchema } from "./auth.schemas.js";
import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.schemas.js";
import { sessionService } from "./session.service.js";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "./auth.cookies.js";

export async function register(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const input = registerSchema.parse(req.body);

        const user = await authService.register(input);
        const { token, session } = await sessionService.create(user.id);

        res.cookie(SESSION_COOKIE_NAME, token, {
            ...sessionCookieOptions,
            expires: session.expiresAt,
        });

        res.status(201).json({
            user,
        });
        
    } catch (error) {
        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const input = loginSchema.parse(req.body);

        const result = await authService.login(input);
        const { user, session } = result;

        res.cookie(SESSION_COOKIE_NAME, session.token, {
            ...sessionCookieOptions,
            expires: result.session.session.expiresAt,
        });

        res.status(200).json({
            user,
        });
    } catch (error) {
        next(error);
    }
}