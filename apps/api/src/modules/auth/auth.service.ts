import argon2 from "argon2";

import { prisma } from "@salesflow/database";
import type { RegisterInput } from "./auth.schemas.js";

import { ConflictError } from "../../errors/conflict-error.js";

export class AuthService {
    async register(input: RegisterInput) {
        const email = input.email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new ConflictError("CONFLICT", "User with this email already exists.");
        }

        const passwordHash = await argon2.hash(input.password, {
            type: argon2.argon2id,
        });

        const user = await prisma.user.create({
            data: {
                email,
                displayName: input.displayName.trim(),
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                status: true,
                emailVerifiedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }
}

export const authService = new AuthService();