import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Spinner } from "@/components/ui/spinner";

export function PortalRedirect() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    const roleCodes = auth.roles.map((role) => role.code);

    if (roleCodes.includes("ADMIN") || roleCodes.includes("SUPER_ADMIN")) {
        return <Navigate to="/admin" replace />;
    }

    if (roleCodes.includes("RSM")) {
        return <Navigate to="/rsm" replace />;
    }

    if (roleCodes.includes("GT_TSM") || roleCodes.includes("MT_TSM")) {
        return <Navigate to="/tsm" replace />;
    }

    if (roleCodes.includes("MTSR")) {
        return <Navigate to="/mtsr" replace />;
    }

    if (roleCodes.includes("ASR")) {
        return <Navigate to="/asr" replace />;
    }

    if (roleCodes.includes("DISTRIBUTOR")) {
        return <Navigate to="/distributor" replace />;
    }

    if (roleCodes.includes("HORECA")) {
        return <Navigate to="/horeca" replace />;
    }

    if (roleCodes.includes("SUPPORT")) {
        return <Navigate to="/support" replace />;
    }
    
    // Default redirect if no roles match
    return <Navigate to="/login" replace />;
}