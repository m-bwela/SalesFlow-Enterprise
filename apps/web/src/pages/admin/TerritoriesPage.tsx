import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  BarChart3,
  CalendarPlus,
  Clock3,
  MapPinned,
  Package,
  PauseCircle,
  Plus,
  Route,
  Snowflake,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { territoriesService, type TerritoriesOverview } from "@/services/territories.service";

// Card widths on a 12-column grid (large screens). Each row of four adds up to 12.
const kpiSpans = [
  "xl:col-span-3", "xl:col-span-3", "xl:col-span-3", "xl:col-span-3",
  "xl:col-span-2", "xl:col-span-4", "xl:col-span-3", "xl:col-span-3",
  "xl:col-span-3", "xl:col-span-3", "xl:col-span-2", "xl:col-span-4",
  "xl:col-span-4", "xl:col-span-4", "xl:col-span-4",
];

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrencyCompact(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

// Mirrors the server's initials algorithm, so the preview usually matches what gets saved.
// "North Coast" -> "NC". The server has the final say and auto-suffixes on any collision.
function previewInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map((word) => word[0]!.toUpperCase()).join("");
  return (words[0] ?? "").slice(0, 2).toUpperCase();
}

function previewCode(name: string, takenCodes: Set<string>) {
  const base = previewInitials(name) || "TR";
  if (!takenCodes.has(base)) return base;
  let suffix = 2;
  while (takenCodes.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

export function TerritoriesPage() {
  const [overview, setOverview] = useState<TerritoriesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [regionId, setRegionId] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const data = await territoriesService.getOverview();
      setOverview(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load territories.");
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const regions = overview?.regions ?? [];
  const territoriesInRegion = regions.find((region) => region.id === regionId)?.territories ?? [];
  const selectedExisting = territoriesInRegion.find((territory) => territory.id === territoryId);
  const takenCodes = useMemo(() => new Set((overview?.territories ?? []).flatMap(({ code }) => (code ? [code] : []))), [overview]);

  const previewName = addingNew ? newName.trim() : selectedExisting?.name ?? "";
  const previewCodeValue = selectedExisting?.shortCode
    ? selectedExisting.shortCode
    : previewName
      ? previewCode(previewName, takenCodes)
      : "";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!regionId) { setError("Choose a region."); return; }
    if (!addingNew && !territoryId) { setError("Choose an existing territory or add a new one."); return; }
    if (addingNew && !newName.trim()) { setError("Type a name for the new territory."); return; }

    setSaving(true);
    try {
      const result = await territoriesService.addTerritory({
        regionId,
        territoryId: addingNew ? undefined : territoryId,
        name: addingNew ? newName.trim() : undefined,
      });
      setNotice(`${result.name} is now coded ${result.shortCode}.`);
      setTerritoryId("");
      setNewName("");
      setAddingNew(false);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not add this territory.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(territoryId: string, isActive: boolean) {
    setError(null);
    try {
      await territoriesService.setStatus(territoryId, !isActive);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this territory.");
    }
  }

  async function remove(territoryId: string, name: string) {
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return;
    setError(null);
    try {
      await territoriesService.remove(territoryId);
      setNotice(`${name} deleted.`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete this territory.");
    }
  }

  const m = overview?.metrics;
  const currency = overview?.currency;
  const kpis = [
    { title: "Total Territories", value: formatNumber(m?.totalTerritories ?? 0), description: "Registered in this organization", icon: MapPinned },
    { title: "Active Territories", value: formatNumber(m?.activeTerritories ?? 0), description: "Currently active", icon: Activity },
    { title: "Inactive", value: formatNumber(m?.inactiveTerritories ?? 0), description: "Currently inactive", icon: PauseCircle },
    { title: "New this month", value: formatNumber(m?.newThisMonth ?? 0), description: "Added this calendar month", icon: CalendarPlus },
    { title: "Regions Covered", value: formatNumber(m?.regionsCovered ?? 0), description: "Regions with a territory", icon: MapPinned },
    { title: "Outlets in Territories", value: formatNumber(m?.outletsInTerritories ?? 0), description: "Registered under these territories", icon: Store },
    { title: "Coolers in Territories", value: formatNumber(m?.coolersInTerritories ?? 0), description: "Total cooler count", icon: Snowflake },
    { title: "Active coolers", value: formatNumber(m?.activeCoolers ?? 0), description: "In currently active outlets", icon: Snowflake },
    { title: "Distributors", value: formatNumber(m?.distributors ?? 0), description: "Attached to these territories", icon: Truck },
    { title: "Active Distributors", value: formatNumber(m?.activeDistributors ?? 0), description: "Currently active", icon: Truck },
    { title: "ASRs (Field Rep)", value: formatNumber(m?.asrs ?? 0), description: "Assigned field reps", icon: Users },
    { title: "Routes", value: m?.routes === null ? "Not tracked" : formatNumber(m?.routes ?? 0), description: "No route data is configured", icon: Route },
    { title: "Active Routes", value: m?.activeRoutes === null ? "Not tracked" : formatNumber(m?.activeRoutes ?? 0), description: "No route data is configured", icon: Route },
    { title: "Orders · 7d", value: formatNumber(m?.ordersLast7Days ?? 0), description: "Last 7 days", icon: BarChart3 },
    { title: "Revenue · 7d", value: formatCurrencyCompact(m?.revenueLast7Days ?? 0, currency), description: "Last 7 days", icon: TrendingUp },
    { title: "Volume · 7d", value: formatNumber(m?.volumeLast7Days ?? 0), description: "Last 7 days", icon: Package },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Manage Territories" description="Add and manage territory codes for outlet code generation." />

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading territories...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

          <Card>
            <CardHeader><CardTitle>Add New Territory</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <label className="space-y-1.5 text-sm">Region *
                  <select className={selectClass} required value={regionId} onChange={(event) => { setRegionId(event.target.value); setTerritoryId(""); setAddingNew(false); setNewName(""); }}>
                    <option value="">Select Region</option>
                    {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                  </select>
                </label>

                <div className="space-y-1.5 text-sm">
                  <span>Territory *</span>
                  {!addingNew ? (
                    <div className="flex gap-2">
                      <select className={selectClass} disabled={!regionId} value={territoryId} onChange={(event) => setTerritoryId(event.target.value)}>
                        <option value="">{territoriesInRegion.length ? "Select territory" : "No territories yet"}</option>
                        {territoriesInRegion.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}{territory.shortCode ? ` (${territory.shortCode})` : ""}</option>)}
                      </select>
                      <Button type="button" variant="outline" size="icon" aria-label="Add a new territory name" title="Add a new territory name" disabled={!regionId} onClick={() => { setAddingNew(true); setTerritoryId(""); }}><Plus /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input autoFocus placeholder="New territory name" value={newName} onChange={(event) => setNewName(event.target.value)} />
                      <Button type="button" variant="outline" size="sm" onClick={() => { setAddingNew(false); setNewName(""); }}>Cancel</Button>
                    </div>
                  )}
                </div>

                <label className="space-y-1.5 text-sm">Code *<Input readOnly value={previewCodeValue} placeholder="Auto-generated" className="bg-muted/30 text-muted-foreground" /></label>
                <label className="space-y-1.5 text-sm">Name *<Input readOnly value={previewName} placeholder="Auto-generated" className="bg-muted/30 text-muted-foreground" /></label>

                <div className="sm:col-span-2 lg:col-span-4">
                  <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Territory"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Territory Metrics</CardTitle>
                {overview && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Updated {formatTime(overview.updatedAt)}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <section aria-label="Territory KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
                {kpis.map((kpi, index) => <div key={kpi.title} className={kpiSpans[index]}><KpiCard {...kpi} /></div>)}
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Territories</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["Code", "Region", "Territory", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(overview?.territories ?? []).map((territory) => (
                      <tr key={territory.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium">{territory.code ?? <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="px-3 py-3 text-muted-foreground">{territory.region}</td>
                        <td className="px-3 py-3">{territory.name}</td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 ${territory.isActive ? "text-emerald-600" : "text-muted-foreground"}`}><span className={`size-1.5 rounded-full ${territory.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />{territory.isActive ? "Active" : "Inactive"}</span></td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => void toggleStatus(territory.id, territory.isActive)}>{territory.isActive ? "Deactivate" : "Activate"}</Button>
                            <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => void remove(territory.id, territory.name)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && (overview?.territories.length ?? 0) === 0 && (
                      <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No territories yet. Add one above.</td></tr>
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
