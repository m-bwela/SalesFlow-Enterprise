import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div>
                <Spinner className="m-auto block text-center my-4 align-middle animate-spin items-center" aria-label="Loading spinner"/>
            </div>
        )
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}