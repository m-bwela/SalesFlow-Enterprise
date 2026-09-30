import type { Session, User } from "@prisma/client";

type AuthUser = Pick<
    User,
    "id" | "email" | "displayName" | "status" | "emailVerifiedAt" | "createdAt" | "updatedAt"
>;
type AuthSession = Pick<Session, "id" | "userId" | "expiresAt" | "revokedAt"> & {
    user: AuthUser;
};

declare global {
    namespace Express {
        interface Locals {
            user?: AuthUser;
            session?: AuthSession;
            requestId?: string;
        }
    }
}

export {};