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

export type TsmDashboardPeriod =
    | "TODAY"
    | "YESTERDAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "THIS_MONTH"
    | "ALL";

export interface TsmDashboardFilters {
    period: TsmDashboardPeriod;
    regionId?: string;
    territoryId?: string;
}

export type DistributorDashboardPeriod = Exclude<DashboardFilters["period"], "LIVE">;

export type ModernTradePeriod =
    | "LIVE"
    | "1H"
    | "6H"
    | "1D"
    | "1W"
    | "1M"
    | "3M"
    | "6M"
    | "YTD"
    | "1Y"
    | "2Y"
    | "3Y"
    | "ALL";

export interface ModernTradeFilters {
    period: ModernTradePeriod;
    regionId?: string;
    territoryId?: string;
    mtsrId?: string;
}

export type AsrDashboardPeriod =
    | "TODAY"
    | "YESTERDAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "TWO_WEEKS_BACK"
    | "THIS_MONTH"
    | "ALL";