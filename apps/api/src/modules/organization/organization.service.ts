import { prisma } from "@salesflow/database";

import type { AuthorizationScope } from "../auth/scope.js";

export async function getOrganizationFilters(
    organizationId: string,
    authorizationScope?: AuthorizationScope,
) {
    const regionIds = authorizationScope && !authorizationScope.global
        ? authorizationScope.regionIds
        : undefined;

    const territoryIds = authorizationScope && !authorizationScope.global
        ? authorizationScope.territoryIds
        : undefined;

    const distributorIds = authorizationScope && !authorizationScope.global
        ? authorizationScope.distributorIds
        : undefined;

    const regions = await prisma.region.findMany({
        where: {
            organizationId,
            isActive: true,
            ...(regionIds && regionIds.length > 0 ? { id: { in: regionIds } } : {}),
        },
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
            code: true,
            territories: {
                where: {
                    isActive: true,
                    ...(territoryIds && territoryIds.length > 0 ? { id: { in: territoryIds } } : {}),
                },
                orderBy: {
                    name: "asc",
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    distributors: {
                        where: {
                            isActive: true,
                            ...(distributorIds && distributorIds.length > 0 ? { id: { in: distributorIds } } : {}),
                        },
                        orderBy: {
                            name: "asc",
                        },
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            },
        },
    });

    return regions;
}