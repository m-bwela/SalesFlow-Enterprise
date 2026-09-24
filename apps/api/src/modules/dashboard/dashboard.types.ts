export interface DashboardFilters {
    period: 
        | "1D"
        | "1W"
        | "1M"
        | "3M"
        | "6M"
        | "YTD"
        | "1Y"
        | "ALL"

    regionId?: string;
    territoryId?: string;
    distributorId?: string;
    asrId?: string;
}