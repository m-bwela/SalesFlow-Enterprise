import  { prisma } from "@salesflow/database";
import { generateSessionToken, hashSessionToken } from "./session.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class SessionService {
    async create(userId: string) {
        const token = generateSessionToken();
        const tokenHash = hashSessionToken(token);

        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

        const session = await prisma.session.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
                lastSeenAt: new Date(),
            },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
                createdAt: true,
            },
        });

        return { token, session };
    }

    async revoke(sessionId: string) {
        const revokedAt = new Date();
        await prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                revokedAt,
                lastSeenAt: revokedAt,
            },
        });
    }

    async createImpersonation(userId: string, adminId: string, durationMs: number) {
    const token = generateSessionToken();
    const session = await prisma.session.create({
        data: {
            userId,
            impersonatedById: adminId,
            tokenHash: hashSessionToken(token),
            expiresAt: new Date(Date.now() + durationMs),
            lastSeenAt: new Date(),
            userAgent: "impersonation",
        },
        select: { id: true, expiresAt: true },
    });
    return { token, session };
}
}

export const sessionService = new SessionService();