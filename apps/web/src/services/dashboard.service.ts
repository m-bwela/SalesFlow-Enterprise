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