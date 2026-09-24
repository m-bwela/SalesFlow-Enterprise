import { apiFetch } from "@/lib/api";
import type { DashboardFilters } from "@/types/dashboard";

export interface AdminDashboardData {
    users: number;
    onlineUsers: number;
    outlets: number;
    sales: {
        amount: number;
        currency: string;
    };
    orders: number;
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