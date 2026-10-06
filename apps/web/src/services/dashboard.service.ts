import { apiFetch } from "@/lib/api";
import type { DashboardFilters } from "@/types/dashboard";

export interface AdminDashboardData {
    users: number;
    onlineUsers: number;
    organizations: number;
    regions: number;
    territories: number;
    distributors: number;
    warehouses: number;
    memberships: number;
    newUsers: number;
    newOrganizations: number;
    userTrend: number[];
    organizationTrend: number[];
    revenue: number;
    currency: string;
    orders: number;
    averageOrderValue: number;
    activeOutlets: number;
    activeProducts: number;
    itemsSold: number;
    deliveredOrders: number;
    cancelledOrders: number;
    deliveryRate: number;
    revenueTrend: number[];
    orderTrend: number[];
    productsByRevenue: Array<{
        productId: string;
        name: string;
        category: string | null;
        quantity: number;
        revenue: number;
    }>;
}

export type OutletDashboardPeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export interface OutletDashboardRow {
    id: string;
    name: string;
    code: string;
    type: "SHOP" | "RESTAURANT" | "KIOSK" | "BAR" | "OTHER";
    phone: string | null;
    imageUrl: string | null;
    region: string;
    territory: string;
    distributor: string;
    createdBy: string;
    revenue: number;
    orders: number;
    coolerCount: number;
    trend: "UP" | "DOWN" | "FLAT" | null;
}

export interface OutletDashboardData {
    period: OutletDashboardPeriod;
    updatedAt: string;
    currency: string;
    stats: {
        totalOutlets: number;
        withCoolers: number;
        withoutCoolers: number;
        revenue: number;
        orders: number;
        volume: number;
        averageRevenuePerOutlet: number;
        shops: number;
        restaurants: number;
        kiosks: number;
        bars: number;
        other: number;
    };
    revenueTrend: number[];
    topTen: OutletDashboardRow[];
    bottomTen: OutletDashboardRow[];
    revenueByType: Array<{ type: string; value: number }>;
    revenueByPaymentMethod: Array<{ method: string; value: number }>;
    coolerRevenueRisk: Array<{ label: string; value: number }>;
    lowOrderCounts: Array<{ label: string; value: number }>;
    outlets: OutletDashboardRow[];
}

export async function getOutletDashboard(period: OutletDashboardPeriod) {
    const response = await apiFetch<{ data: OutletDashboardData }>(
        `/api/v1/dashboard/outlets?period=${encodeURIComponent(period)}`,
    );
    return response.data;
}

export type AsrDashboardPeriod =
    | "TODAY"
    | "YESTERDAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "TWO_WEEKS_BACK"
    | "THIS_MONTH"
    | "ALL";

export interface AsrDashboardData {
    period: AsrDashboardPeriod;
    totalAsrs: number;
    activeAsrs: number;
    onlineNow: number;
    suspendedAsrs: number;
    revenue: number;
    sellingAsrs: number;
    visitingAsrs: number | null;
    averageRevenuePerAsr: number;
    currency: string;
    revenueTrend: number[];
    ordersTrend: number[];
    asrs: Array<{
        id: string;
        name: string;
        email: string;
        phoneNumber: string | null;
        profileImageUrl: string | null;
        status: string;
        online: boolean;
        region: string | null;
        territory: string | null;
        distributor: string | null;
        revenue: number;
        orders: number;
        cratesSold: number;
        rating: number | null;
        visits: number | null;
        coolers: number | null;
        newOutlets: number | null;
    }>;
}

export type TsmDashboardPeriod = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "ALL";

export interface TsmDashboardData {
    period: TsmDashboardPeriod;
    updatedAt: string;
    stats: {
        totalTsms: number;
        activeTsms: number;
        onlineNow: number;
        distributors: number;
        asrsAttached: number;
        revenue: number;
        ordersProcessed: number;
        deliveryRate: number;
    };
    regions: Array<{ id: string; name: string }>;
    territories: Array<{ id: string; name: string; regionId: string }>;
    rows: Array<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        status: string;
        online: boolean;
        region: string;
        territory: string;
        distributors: number;
        asrs: number;
        team: {
            asrs: Array<{ id: string; name: string; phone: string | null }>;
            distributors: Array<{ id: string; name: string }>;
        };
        revenue: number;
        processed: number;
        delayed: number;
        delivered: number;
        lastLogin: string | null;
        rank: number;
    }>;
}

export type DistributorDashboardPeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export interface DistributorDashboardRow {
    id: string;
    name: string;
    code: string;
    phone: string | null;
    region: string;
    territory: string;
    active: boolean;
    revenue: number;
    previousRevenue: number;
    trendPercent: number | null;
    trend: "UP" | "DOWN" | "FLAT" | null;
    orders: number;
    volume: number;
    warehouses: number;
}

export interface DistributorDashboardData {
    period: DistributorDashboardPeriod;
    updatedAt: string;
    currency: string;
    stats: {
        totalDistributors: number;
        activeDistributors: number;
        inactiveDistributors: number;
        revenue: number;
        orders: number;
        volume: number;
        averageRevenuePerDistributor: number;
        averageOrdersPerDistributor: number;
        stocksAtHand: number | null;
        healthy: number | null;
        warning: number | null;
        atRisk: number | null;
    };
    stockTrackingAvailable: boolean;
    revenueTrend: Array<{ bucket: string; revenue: number }>;
    topTen: DistributorDashboardRow[];
    bottomTen: DistributorDashboardRow[];
    distributors: DistributorDashboardRow[];
}

export async function getDistributorDashboard(period: DistributorDashboardPeriod) {
    const response = await apiFetch<{ data: DistributorDashboardData }>(
        `/api/v1/dashboard/distributors?period=${encodeURIComponent(period)}`,
    );
    return response.data;
}

export type ModernTradePeriod = "LIVE" | "1H" | "6H" | "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "2Y" | "3Y" | "ALL";

export interface ModernTradeRow {
    id: string;
    rank: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    online: boolean;
    region: string;
    territory: string;
    revenue: number;
    volume: number;
    outlets: number;
    outletsOrdering: number;
    orders: number;
    factoryOrders: number;
}

export interface ModernTradeData {
    period: ModernTradePeriod;
    updatedAt: string;
    currency: string;
    stats: {
        totalMtsrs: number;
        activeMtsrs: number;
        onlineNow: number;
        revenue: number;
        orders: number;
        volume: number;
        outlets: number;
        outletsOrdering: number;
        factoryOrders: number;
        factoryShare: number;
        averageRevenuePerMtsr: number;
        averageOrderValue: number;
    };
    options: {
        regions: Array<{ id: string; name: string; territories: Array<{ id: string; name: string }> }>;
        mtsrs: Array<{ id: string; name: string; regionId: string | null; territoryId: string | null }>;
    };
    rows: ModernTradeRow[];
}

export async function getModernTradeDashboard(filters: {
    period: ModernTradePeriod;
    regionId?: string;
    territoryId?: string;
    mtsrId?: string;
}) {
    const params = new URLSearchParams({ period: filters.period });
    if (filters.regionId) params.set("regionId", filters.regionId);
    if (filters.territoryId) params.set("territoryId", filters.territoryId);
    if (filters.mtsrId) params.set("mtsrId", filters.mtsrId);
    const response = await apiFetch<{ data: ModernTradeData }>(`/api/v1/dashboard/modern-trade?${params.toString()}`);
    return response.data;
}

export async function getTsmDashboard(filters: {
    period: TsmDashboardPeriod;
    regionId?: string;
    territoryId?: string;
}) {
    const params = new URLSearchParams({ period: filters.period });
    if (filters.regionId) params.set("regionId", filters.regionId);
    if (filters.territoryId) params.set("territoryId", filters.territoryId);

    const response = await apiFetch<{ data: TsmDashboardData }>(`/api/v1/dashboard/tsm?${params.toString()}`);
    return response.data;
}

export async function getAsrDashboard(period: AsrDashboardPeriod) {
    const response = await apiFetch<{ data: AsrDashboardData }>(
        `/api/v1/dashboard/asr?period=${encodeURIComponent(period)}`,
    );

    return response.data;
}

export async function getAdminDashboard(
    filters?: DashboardFilters,
) {

    const params = new URLSearchParams();

    if (filters?.period) {
        params.set("period", filters.period);
    }

    if (filters?.regionId) {
        params.set("regionId", filters.regionId);
    }

    if (filters?.territoryId) {
        params.set("territoryId", filters.territoryId);
    }

    if (filters?.distributorId) {
        params.set("distributorId", filters.distributorId);
    }

    if (filters?.asrId) {
        params.set("asrId", filters.asrId);
    }

    const query = params.toString();

    const response = await apiFetch<{
        data: AdminDashboardData;
    }>(`/api/v1/dashboard/admin${query ? `?${query}` : "" }`);

    return response.data;
}