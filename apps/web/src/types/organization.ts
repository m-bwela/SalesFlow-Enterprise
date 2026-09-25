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