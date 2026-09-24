export type DashboardPeriod = 
    | "1D"
    | "1W"
    | "1M"
    | "3M"
    | "6M"
    | "YTD"
    | "1Y"
    | "ALL";

export interface DashboardFilters {
    period: DashboardPeriod;
    regionId?: string;
    territoryId?: string;
    distributorId?: string;
    asrId?: string;
}