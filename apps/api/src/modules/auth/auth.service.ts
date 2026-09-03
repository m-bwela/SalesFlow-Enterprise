import argon2 from "argon2";

import { prisma } from "@salesflow/database";
import type { RegisterInput, LoginInput } from "./auth.schemas.js";

import { ConflictError } from "../../errors/conflict-error.js";
import { AppError } from "../../errors/app-error.js";

import { sessionService } from "./session.service.js";

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

    async login(input: LoginInput) {
        const email = input.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user || !user.passwordHash) {
            throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
        }

        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            input.password,
        );

        if (!isPasswordValid) {
            throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
        }

        if(user.status !== "ACTIVE") {
            throw new AppError("ACCOUNT_UNAVAILABLE", 403, "This account is not available.");
        }

        const session = await sessionService.create(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                status: user.status,
                emailVerifiedAt: user.emailVerifiedAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            session,
        };
    }
}

export const authService = new AuthService();