import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email(),
    displayName: z.string().trim().min(2).max(100),
    password: z.string().trim().min(8).max(128),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().trim().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;