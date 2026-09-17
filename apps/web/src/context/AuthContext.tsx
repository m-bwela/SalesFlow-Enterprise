import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AuthContext as AuthContextData } from "../types/auth";
import { authService } from "../services/auth.service";

interface AuthContextValue {
    auth: AuthContextData | null;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthContextData | null>(null);

    const [loading, setLoading] = useState(true);

    async function refresh() {
        try {
            const context = await authService.context();
            setAuth(context);
        } catch {
            setAuth(null);
        }
    }

    async function logout() {
        await authService.logout();
        setAuth(null);
    }

    useEffect(() => {
        refresh().finally(() => {
            setLoading(false);
        })
    }, []);

    return (
        <AuthContext.Provider value={{ auth, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}