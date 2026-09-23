import { apiFetch } from "../lib/api";
import type { AuthContext, AuthUser, Portal } from "../types/auth";

interface ApiResponse<T> {
    data: T;
}

export const authService = {
    async login(credentials: { email: string; password: string }): Promise<{ user: AuthUser }> {
        return apiFetch<{ user: AuthUser }>("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    async me(): Promise<AuthUser> {
        const response = await apiFetch<{ user: AuthUser }>("/api/v1/auth/me");
        return response.user;
    },

    async context(): Promise<AuthContext> {
        const response = await apiFetch<ApiResponse<AuthContext>>("/api/v1/auth/context");
        return response.data;
    },

    async portal(): Promise<Portal> {
        const response = await apiFetch<ApiResponse<Portal>>("/api/v1/auth/portal");
        return response.data;
    },

    async logout(): Promise<void> {
        await apiFetch<void>("/api/v1/auth/logout", {
            method: "POST",
        });
    },
};