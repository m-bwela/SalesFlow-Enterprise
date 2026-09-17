export type RoleCode =
    | "ADMIN"
    | "RSM"
    | "GT_TSM"
    | "MT_TSM"
    | "MTSR"
    | "ASR";

export type ScopeType =
    | "GLOBAL"
    | "REGION"
    | "TERRITORY"
    | "DISTRIBUTOR"
    | "WAREHOUSE";

export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
}

export interface AuthRole {
    code: RoleCode;
    name: string;
    scopeType: ScopeType;
    regionId?: string | null;
    territoryId?: string | null;
    distributorId?: string | null;
    warehouseId?: string | null;
}

export interface AuthorizationScope {
    global: boolean;
    regionIds: string[];
    territoryIds: string[];
    distributorIds: string[];
    warehouseIds: string[];
}

export interface AuthContext {
    user: AuthUser;
    roles: AuthRole[];
    authorizationScope: AuthorizationScope;
}

export interface Portal {
    code: RoleCode | "TSM";
    path: string;
}