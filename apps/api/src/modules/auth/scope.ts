export const ScopeType = {
    GLOBAL: 'GLOBAL',
    REGION: 'REGION',
    TERRITORY: 'TERRITORY',
    DISTRIBUTOR: 'DISTRIBUTOR',
    WAREHOUSE: 'WAREHOUSE',
} as const;

export type ScopeType = string;

export interface AuthorizationScope {
    global: boolean;
    regionIds: string[];
    territoryIds: string[];
    distributorsIds: string[];
    warehouseIds: string[];
}

export function resolveAuthorizationScope(
    membershipRoles: any[],
): AuthorizationScope {
    const scope: AuthorizationScope = {
        global: false,
        regionIds: [],
        territoryIds: [],
        distributorsIds: [],
        warehouseIds: [],
    };

    for (const membershipRole of membershipRoles) {
        switch (membershipRole.scopeType) {
           case  ScopeType.GLOBAL:
               scope.global = true;
               break;

            case ScopeType.REGION:
                if (membershipRole.regionId) {
                    scope.regionIds.push(membershipRole.regionId);
                }
                break;
            case ScopeType.TERRITORY:
                if (membershipRole.territoryId) {
                    scope.territoryIds.push(membershipRole.territoryId);
                }
                break;
            case ScopeType.DISTRIBUTOR:
                if (membershipRole.distributorId) {
                    scope.distributorsIds.push(membershipRole.distributorId);
                }
                break;
            case ScopeType.WAREHOUSE:
                if (membershipRole.warehouseId) {
                    scope.warehouseIds.push(membershipRole.warehouseId);
                }
                break;
        }
    }
    return {
        ...scope,
        regionIds: [...new Set(scope.regionIds)],
        territoryIds: [...new Set(scope.territoryIds)],
        distributorsIds: [...new Set(scope.distributorsIds)],
        warehouseIds: [...new Set(scope.warehouseIds)],
    }
}