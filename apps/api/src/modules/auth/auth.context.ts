import type { Request, Response, NextFunction } from "express";

import { prisma } from "@salesflow/database";
import { resolveAuthorizationScope } from "./scope.js";

// Returns the current user's active roles and computed authorization scope.
export async function getAuthContext(
    _req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = res.locals.user;

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
                    },
                    include: {
                        role: true,
                    },
                },
            },
        });

        const roles = membership?.roles ?? [];

        res.status(200).json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                },
                roles: roles.map((membershipRole) => ({
                    code: membershipRole.role.code,
                    name: membershipRole.role.name,
                    scopeType: membershipRole.scopeType,
                    regionId: membershipRole.regionId,
                    territoryId: membershipRole.territoryId,
                    distributorId: membershipRole.distributorId,
                    warehouseId: membershipRole.warehouseId,
                })),
                authorizationScope: resolveAuthorizationScope(roles),
            },
        });
    } catch (error) {
        next(error);
    }
}
