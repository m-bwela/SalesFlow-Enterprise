import { apiFetch } from "@/lib/api";

export interface AuditRow {
  id: string; action: string; resourceType: string | null; resourceId: string | null;
  actor: string; metadata: unknown; requestId: string | null; createdAt: string;
}
export interface AuditPage {
  rows: AuditRow[]; total: number; page: number; pageSize: number;
  actions: string[]; resourceTypes: string[];
  stats: { today: number; week: number; actors: number };
}
export interface AuditFilters { search: string; action: string; resourceType: string; from: string; to: string; page: number }

export const auditLogService = {
  async list(f: AuditFilters) {
    const p = new URLSearchParams({ page: String(f.page) });
    (["search", "action", "resourceType", "from", "to"] as const).forEach((k) => f[k] && p.set(k, f[k]));
    return (await apiFetch<{ data: AuditPage }>(`/api/v1/audit-logs?${p}`)).data;
  },
};