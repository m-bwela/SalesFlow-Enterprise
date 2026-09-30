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