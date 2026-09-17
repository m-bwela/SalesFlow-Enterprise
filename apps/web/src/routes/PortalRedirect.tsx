import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export function PortalRedirect() {
    const { auth, loading } = useAuth();

    if (loading) {
        return (
            <div>Loading SalesFlow...</div>
        );
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    const roleCodes = auth.roles.map((role) => role.code);

    if (roleCodes.includes("ADMIN")) {
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
    
    // Default redirect if no roles match
    return <Navigate to="/login" replace />;
}