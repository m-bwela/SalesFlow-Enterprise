import { apiFetch } from "@/lib/api";

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

export async function getAdminDashboard() {
    const response = await apiFetch<{
        data: AdminDashboardData;
    }>("/api/v1/dashboard/admin");

    return response.data;
}