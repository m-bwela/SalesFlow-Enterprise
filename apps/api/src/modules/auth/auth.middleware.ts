import type { RequestHandler } from 'express';

import { prisma } from "@salesflow/database";
import { SESSION_COOKIE_NAME } from './auth.cookies.js';
import { hashSessionToken } from "./session.js";

const BLOCKED_WHILE_IMPERSONATING = /\/(auth\/(change-password|reset-password)|users\/[^/]+\/(reset-password|role)|impersonation\/[^/]+\/start)$/;

export const authenticate: RequestHandler = async (req, res, next) => {
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
            select: {
                id: true,
                userId: true,
                expiresAt: true,
                revokedAt: true,
                lastSeenAt: true,
                impersonatedById: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        status: true,
                        emailVerifiedAt: true,
                        createdAt: true,
                        updatedAt: true,
                        lockedUntil: true,
                    },
                },
            },
        });

        const now = new Date();
        if (
            !session ||
            session.revokedAt ||
            session.expiresAt <= now ||
            session.user.status !== "ACTIVE" ||
            Boolean(session.user.lockedUntil && session.user.lockedUntil > now)
        ) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Authentication required',
                    requestId: res.locals.requestId,
                },
            });
            return; // Ensure the request does not proceed further
        }

        const user = session.user;
        const impersonatedById = session.impersonatedById ?? null;

        if (!session.lastSeenAt || now.getTime() - session.lastSeenAt.getTime() >= 60_000) {
             await prisma.$transaction([
                 prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: now } }),
                 //prisma.user.update({ where: { id: session.userId }, data: { lastSeenAt: now } }),
                 ...(impersonatedById ? [] : [prisma.user.update({
                    where: {
                        id: session.userId,
                    },
                    data: {
                        lastSeenAt: now,
                    }
                 })]),
            ]);
        }
        const authSession = {
            id: session.id,
            userId: session.userId,
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt,
            user,
        };

        res.locals.user = user;
        res.locals.session = authSession;
        res.locals.impersonatedById = impersonatedById;

        if (impersonatedById) {
            const path = req.originalUrl.split("?")[0];
            const isWrite = !["GET", "HEAD", "OPTIONS"].includes(req.method);

            if (isWrite && BLOCKED_WHILE_IMPERSONATING.test(path)) {
                res.status(403).json({
                    error: {
                        code: "IMPERSONATION_BLOCKED",
                        message: "This action can't be done while acting as another user. Exit the session first.",
                        requestId: res.locals.requestId,
                    },
                });
                return; // Ensure the request does not proceed further
            }

            // Record every write against the real admin, never the user being acted as
            if (isWrite) {
                res.on("finish", () => {
                    prisma.auditLog.create({
                        data: {
                            organizationId: res.locals.membership?.organizationId ?? null,
                            actorId: impersonatedById,
                            action: "IMPERSONATED_REQUEST",
                            resourceType: "User",
                            resourceId: session.userId,
                            requestId: res.locals.requestId,
                            metadata: {
                                method: req.method,
                                path,
                                status: res.statusCode,
                            },
                        },
                    }).catch(() => undefined);
                })
            }
        }

        next(); // Proceed to the next middleware or route handler
    
    } catch (error) {
        next(error); // Pass the error to the next error-handling middleware
    }
}