import type { RequestHandler } from 'express';

import { prisma } from "@salesflow/database";
import { SESSION_COOKIE_NAME } from './auth.cookies.js';
import { hashSessionToken } from "./session.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
    try {
        const token = req.cookies?.[SESSION_COOKIE_NAME];

        if (!token) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Authentication required',
                    requestId: res.locals.requestId,
                },
            });
            return; // Ensure the request does not proceed further
        }

        const tokenHash = hashSessionToken(token);

        const session = await prisma.session.findUnique({
            where: {
                tokenHash,
            },
            include: {
                user: true,
            },
        });

        if (!session || session.revokedAt || session.expiresAt <= new Date()) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Authentication required',
                    requestId: res.locals.requestId,
                },
            });
            return; // Ensure the request does not proceed further
        }

        res.locals.user = session.user;
        res.locals.session = session;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        next(error); // Pass the error to the next error-handling middleware
    }
}