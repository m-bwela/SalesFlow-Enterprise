export interface DashboardFilters {
    period: 
        | "LIVE"
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

export type AsrDashboardPeriod =
    | "TODAY"
    | "YESTERDAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "TWO_WEEKS_BACK"
    | "THIS_MONTH"
    | "ALL";