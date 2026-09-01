import type { Session, User } from "@prisma/client";

declare global {
    namespace Express {
        interface Locals {
            user?: User;
            session?: Session;
            requestId?: string;
        }
    }
}

export {};