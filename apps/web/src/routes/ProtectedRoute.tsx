import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export function ProtectedRoute() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div>Loading SalesFlow...</div>
        )
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}