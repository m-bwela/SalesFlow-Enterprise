import { apiFetch } from "@/lib/api";

export interface RouteRow {
    id: string; code: string; name: string; frequency: "WEEKLY" | "MONTHLY"; isActive: boolean;
    territoryId: string | null; territory: string | null; agent: string | null;
    outlets: number; orders30d: number; revenue30d: number;
}

export interface RoutesOverview {
    updatedAt: string;
    stats: {
        total: number; active: number; inactive: number; weekly: number; monthly: number; withAgent: number; unassigned: number;
        outletsOnRoutes: number; avgOutletsPerRoute: number; territoriesCovered: number; newThisMonth: number;
        orders7d: number; revenue7d: number; volume7d: number; activeAgents7d: number;
        avgRevenuePerRoute30d: number; avgOrdersPerRoute30d: number; bestRoute30d: string | null; bestAgent30d: string | null; totalRevenue30d: number;
    };
    trend: Array<{ day: string; orders: number; revenue: number }>;
    topRoutes: Array<{ routeId: string; name: string; orders: number; revenue: number }>;
    routes: RouteRow[];
    territories: Array<{ id: string; name: string }>;
    agents: Array<{ id: string; displayName: string }>;
}

export interface NewRoute {
    name: string;
    code: string;
    frequency: "WEEKLY" | "MONTHLY";
    territoryId: string | null;
    agentId: string | null;
}

export const routeManagementService = {
    async getOverview() {
        return (await apiFetch<{ data: RoutesOverview }>("/api/v1/routes")).data;
    },
    async createRoute(route: NewRoute) {
        return apiFetch<{ data: { id: string } }>("/api/v1/routes",
            {
                method: "POST",
                body: JSON.stringify(route),
            }
        );
    },
};