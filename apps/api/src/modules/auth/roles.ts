import type { Request, Response, NextFunction } from 'express';

export type RoleCode = string;

export function requireRole(...allowedRoles: RoleCode[]) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const roles = res.locals.roles ?? [];

        const hasRole = roles.some((membershipRole: any) => allowedRoles.includes(membershipRole.role.code));

        if (!hasRole) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have the required role to access this resource.'
                }
            })
        }

        next();
    };
}