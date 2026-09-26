export interface OrganizationDistributor {
    id: string;
    name: string;
    code: string;
}

export interface OrganizationTerritory {
    id: string;
    name: string;
    code: string;
    distributors: OrganizationDistributor[];
}

export interface OrganizationRegion {
    id: string;
    name: string;
    code: string;
    territories: OrganizationTerritory[];
}

export interface OrganizationAsr {
    id: string;
    name: string;
    email: string;
    regionId: string | null;
    territoryId: string | null;
    distributorId: string | null;
}

export interface OrganizationFilters {
    regions: OrganizationRegion[];
    asrs: OrganizationAsr[];
}