import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import type { RoleCode } from '../types/auth.js';

interface RoleRouteProps {
    allowedRoles: RoleCode[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
    const { auth, loading } = useAuth();

    if (loading) {
        return <div>Loading SalesFlow...</div>;
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    const hasAllowedRole = auth.roles.some((role) => allowedRoles.includes(role.code));

    if (!hasAllowedRole) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}