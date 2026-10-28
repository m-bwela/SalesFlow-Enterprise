import { apiFetch } from "@/lib/api";

export interface RegionRow {
  id: string; name: string; code: string; isActive: boolean;
  territories: number; distributors: number; outlets: number; coolers: number; asrs: number;
  orders30d: number; revenue30d: number;
}
export interface RegionsOverview {
  updatedAt: string;
  currency: string;
  metrics: {
    totalRegions: number; activeRegions: number; inactiveRegions: number; newThisMonth: number;
    territories: number; distributors: number; outlets: number; coolers: number; asrs: number;
    orders7d: number; revenue7d: number; volume7d: number; bestRegion30d: string | null;
  };
  regions: RegionRow[];
}

export const regionsService = {
  async getOverview() { return (await apiFetch<{ data: RegionsOverview }>("/api/v1/regions")).data; },
  async addRegion(name: string) {
    return (await apiFetch<{ data: { id: string; name: string; code: string } }>("/api/v1/regions", { method: "POST", body: JSON.stringify({ name }) })).data;
  },
  setStatus: (id: string, isActive: boolean) => apiFetch(`/api/v1/regions/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  remove: (id: string) => apiFetch(`/api/v1/regions/${id}`, { method: "DELETE" }),
};