import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@salesflow/database';
import { resolveAuthorizationScope } from './scope.js';

export function requirePermission(permissionCode: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = res.locals.user;

            if (!user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHENTICATED',
                        message: 'Authentication required',
                    }
                });
            }

            const membership = await prisma.membership.findFirst({
                where: {
                    userId: user.id,
                    isActive: true,
                },
                include: {
                    roles: {
                        where: {
                            isActive: true,
                            OR: [
                                { endsAt: null },
                                { endsAt: { gt: new Date() } },
                            ],
                            role: {
                                rolePermissions: {
                                    some: {
                                        permission: {
                                            code: permissionCode,
                                        },
                                    },
                                },
                            },
                        },
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (!membership || membership.roles.length === 0) {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have the required permission',
                    },
                });
            }

            res.locals.membership = membership;                              
            res.locals.roles = membership.roles;
            res.locals.authorizationScope = resolveAuthorizationScope(membership.roles);

            return next();
        } catch (error) {
            return next(error);
        }
    }
}