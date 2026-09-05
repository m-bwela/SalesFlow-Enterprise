import type { Request, Response, NextFunction } from "express";

import { sessionService } from "./session.service.js";
import { SESSION_COOKIE_NAME, sessionCookieOptions, } from "./auth.cookies.js";

export async function logout(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const session = res.locals.session;

        if (session) {
            await sessionService.revoke(session.id);
        }

        res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}