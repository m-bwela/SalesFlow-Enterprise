import { apiFetch } from "@/lib/api";

export interface TerritoryRow {
  id: string;
  code: string | null;
  name: string;
  region: string;
  isActive: boolean;
}

export interface TerritoriesOverview {
  updatedAt: string;
  currency: string;
  metrics: {
    totalTerritories: number;
    activeTerritories: number;
    inactiveTerritories: number;
    newThisMonth: number;
    regionsCovered: number;
    outletsInTerritories: number;
    coolersInTerritories: number;
    activeCoolers: number;
    distributors: number;
    activeDistributors: number;
    asrs: number;
    routes: number | null;
    activeRoutes: number | null;
    ordersLast7Days: number;
    revenueLast7Days: number;
    volumeLast7Days: number;
  };
  regions: Array<{
    id: string;
    name: string;
    territories: Array<{ id: string; name: string; shortCode: string | null }>;
  }>;
  territories: TerritoryRow[];
}

export const territoriesService = {
  async getOverview() {
    const response = await apiFetch<{ data: TerritoriesOverview }>("/api/v1/territories");
    return response.data;
  },

  async addTerritory(input: { regionId: string; territoryId?: string; name?: string }) {
    const response = await apiFetch<{ data: { id: string; name: string; regionId: string; shortCode: string | null } }>(
      "/api/v1/territories",
      { method: "POST", body: JSON.stringify(input) },
    );
    return response.data;
  },

  async setStatus(territoryId: string, isActive: boolean) {
    const response = await apiFetch<{ data: { id: string; isActive: boolean } }>(
      `/api/v1/territories/${territoryId}/status`,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    );
    return response.data;
  },

  async remove(territoryId: string) {
    const response = await apiFetch<{ data: { id: string } }>(`/api/v1/territories/${territoryId}`, { method: "DELETE" });
    return response.data;
  },
};
