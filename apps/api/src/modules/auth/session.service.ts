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
        await prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }
}

export const sessionService = new SessionService();