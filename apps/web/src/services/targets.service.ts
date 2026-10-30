import { apiFetch } from "@/lib/api";

export type TargetLevel = "REGION" | "TERRITORY" | "ASR";
export interface Metrics { revenue: number; volume: number; orders: number; newOutlets: number }
export interface TargetRow { id: string; name: string; parent: string | null; hasTarget: boolean; target: Metrics; actual: Metrics }
export interface TargetsOverview { month: string; level: TargetLevel; updatedAt: string; rows: TargetRow[] }

export const targetsService = {
  async get(level: TargetLevel, month: string) {
    return (await apiFetch<{ data: TargetsOverview }>(`/api/v1/targets?level=${level}&month=${month}`)).data;
  },
  set: (level: TargetLevel, month: string, entityId: string, m: Metrics) =>
    apiFetch("/api/v1/targets", { method: "PUT", body: JSON.stringify({ level, month, entityId, ...m }) }),
  async copy(level: TargetLevel, fromMonth: string, toMonth: string) {
    return (await apiFetch<{ data: { copied: number } }>("/api/v1/targets/copy", { method: "POST", body: JSON.stringify({ level, fromMonth, toMonth }) })).data;
  },
};