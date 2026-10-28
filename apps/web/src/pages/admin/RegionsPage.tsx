import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, BarChart3, CalendarPlus, Clock3, Globe2, MapPinned, Package, PauseCircle, Snowflake, Store, TrendingUp, Trophy, Truck, Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { regionsService, type RegionsOverview } from "@/services/regions.service";

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";
const num = (v: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v);
const kes = (v: number, c = "KES") => `${c} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
const time = (v: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(v));

// Mirrors the server's initials algorithm for the preview. The server has the final say on collisions.
function previewCode(name: string, taken: Set<string>) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  const base = (w.length > 1 ? w.map((x) => x[0]!.toUpperCase()).join("") : (w[0] ?? "").slice(0, 2).toUpperCase()) || "";
  if (!base) return "";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function RegionsPage() {
  const [overview, setOverview] = useState<RegionsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  async function refresh() {
    try { setOverview(await regionsService.getOverview()); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load regions."); }
  }
  useEffect(() => { void (async () => { setLoading(true); await refresh(); setLoading(false); })(); }, []);

  const taken = useMemo(() => new Set((overview?.regions ?? []).map((r) => r.code)), [overview]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (overview?.regions ?? []).filter((r) =>
      (status === "all" || (status === "active") === r.isActive) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)));
  }, [overview, search, status]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null);
    if (name.trim().length < 2) { setError("Type a name for the new region."); return; }
    setSaving(true);
    try {
      const r = await regionsService.addRegion(name.trim());
      setNotice(`${r.name} is now coded ${r.code}.`);
      setName("");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add this region."); }
    finally { setSaving(false); }
  }
  async function toggle(id: string, isActive: boolean) {
    setError(null);
    try { await regionsService.setStatus(id, !isActive); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update this region."); }
  }
  async function remove(id: string, regionName: string) {
    if (!window.confirm(`Delete ${regionName}? This can't be undone.`)) return;
    setError(null);
    try { await regionsService.remove(id); setNotice(`${regionName} deleted.`); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete this region."); }
  }

  const m = overview?.metrics, cur = overview?.currency;
  const kpis = [
    { title: "Total Regions", value: num(m?.totalRegions ?? 0), description: "Registered in this organization", icon: Globe2 },
    { title: "Active Regions", value: num(m?.activeRegions ?? 0), description: "Currently active", icon: Activity },
    { title: "Inactive", value: num(m?.inactiveRegions ?? 0), description: "Currently inactive", icon: PauseCircle },
    { title: "New this month", value: num(m?.newThisMonth ?? 0), description: "Added this calendar month", icon: CalendarPlus },
    { title: "Territories", value: num(m?.territories ?? 0), description: "Across all regions", icon: MapPinned },
    { title: "Distributors", value: num(m?.distributors ?? 0), description: "Attached to these regions", icon: Truck },
    { title: "Outlets", value: num(m?.outlets ?? 0), description: "Registered under these regions", icon: Store },
    { title: "Coolers", value: num(m?.coolers ?? 0), description: "Total cooler count", icon: Snowflake },
    { title: "ASRs (Field Rep)", value: num(m?.asrs ?? 0), description: "Assigned to a region", icon: Users },
    { title: "Orders · 7d", value: num(m?.orders7d ?? 0), description: "Last 7 days", icon: BarChart3 },
    { title: "Revenue · 7d", value: kes(m?.revenue7d ?? 0, cur), description: "Last 7 days", icon: TrendingUp },
    { title: "Volume · 7d", value: num(m?.volume7d ?? 0), description: "Last 7 days", icon: Package },
    { title: "Best Region · 30d", value: m?.bestRegion30d ?? "—", description: "Highest revenue", icon: Trophy },
  ];
  const chart = [...(overview?.regions ?? [])].filter((r) => r.revenue30d > 0).sort((a, b) => b.revenue30d - a.revenue30d).slice(0, 8);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Manage Regions" description="Add and manage the regions your territories and distributors belong to." />

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading regions...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

          <Card>
            <CardHeader><CardTitle>Add New Region</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <label className="space-y-1.5 text-sm lg:col-span-2">Region name *
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Coast" />
                </label>
                <label className="space-y-1.5 text-sm">Code *<Input readOnly value={previewCode(name, taken)} placeholder="-- Auto-generated --" className="bg-muted/30 text-muted-foreground" /></label>
                <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Region"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Region Metrics</CardTitle>
                {overview && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Updated {time(overview.updatedAt)}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <section aria-label="Region KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue by Region · 30d</CardTitle></CardHeader>
            <CardContent className="h-64">
              {chart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} fontSize={11} />
                    <YAxis width={44} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                    <Tooltip formatter={(v) => [`${cur} ${Math.round(Number(v)).toLocaleString("en-KE")}`, "Revenue"]} />
                    <Bar dataKey="revenue30d" fill="#0f6b4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No sales in the last 30 days.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Regions</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search regions" aria-label="Search regions" className="sm:w-56" />
                  <select className={`${selectClass} sm:w-36`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                    <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                  <Button type="button" variant="outline" onClick={() => { setSearch(""); setStatus("all"); }}>Reset</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["Code", "Region", "Territories", "Distributors", "Outlets", "ASRs", "Orders · 30d", "Revenue · 30d", "Status", "Actions"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium">{r.code}</td>
                        <td className="px-3 py-3">{r.name}</td>
                        <td className="px-3 py-3">{r.territories}</td>
                        <td className="px-3 py-3">{r.distributors}</td>
                        <td className="px-3 py-3">{r.outlets}</td>
                        <td className="px-3 py-3">{r.asrs}</td>
                        <td className="px-3 py-3">{r.orders30d}</td>
                        <td className="whitespace-nowrap px-3 py-3">{kes(r.revenue30d, cur)}</td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 ${r.isActive ? "text-emerald-600" : "text-muted-foreground"}`}><span className={`size-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />{r.isActive ? "Active" : "Inactive"}</span></td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => void toggle(r.id, r.isActive)}>{r.isActive ? "Deactivate" : "Activate"}</Button>
                            <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => void remove(r.id, r.name)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && rows.length === 0 && (
                      <tr><td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">{(overview?.regions.length ?? 0) === 0 ? "No regions yet. Add one above." : "No regions match your filters."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}