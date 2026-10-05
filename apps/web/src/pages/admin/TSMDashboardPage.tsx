import { Fragment, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Gauge,
  MapPinned,
  Percent,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { getTsmDashboard, type TsmDashboardData, type TsmDashboardPeriod } from "@/services/dashboard.service";

const periods: Array<{ label: string; value: TsmDashboardPeriod }> = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "This week", value: "THIS_WEEK" },
  { label: "Last week", value: "LAST_WEEK" },
  { label: "This month", value: "THIS_MONTH" },
  { label: "All", value: "ALL" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number) {
  return `KES ${new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "No login recorded";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300";
    case "Inactive":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
}

export function TSMDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TsmDashboardPeriod>("THIS_WEEK");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState("");
  const [expandedTsmId, setExpandedTsmId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<TsmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTsmDashboard({
          period: selectedPeriod,
          regionId: selectedRegionId || undefined,
          territoryId: selectedTerritoryId || undefined,
        });
        if (active) setDashboard(data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load TSM dashboard data.");
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [selectedPeriod, selectedRegionId, selectedTerritoryId, refreshing]);

  const visibleTerritories = dashboard?.territories.filter(
    (territory) => !selectedRegionId || territory.regionId === selectedRegionId,
  ) ?? [];
  const stats = dashboard?.stats;
  const metrics = [
    { title: "Total TSMs", value: formatNumber(stats?.totalTsms ?? 0), description: "Assigned territory managers", icon: Users },
    { title: "Active TSMs", value: formatNumber(stats?.activeTsms ?? 0), description: "Active user accounts", icon: Activity },
    { title: "Online Now", value: formatNumber(stats?.onlineNow ?? 0), description: "Seen in the last 5 minutes", icon: Gauge },
    { title: "Distributors", value: formatNumber(stats?.distributors ?? 0), description: "In selected TSM scopes", icon: Store },
    { title: "ASRs Attached", value: formatNumber(stats?.asrsAttached ?? 0), description: "Unique assigned ASRs", icon: MapPinned },
    { title: "Revenue", value: formatCurrency(stats?.revenue ?? 0), description: `For ${periods.find(({ value }) => value === selectedPeriod)?.label}`, icon: TrendingUp },
    { title: "Orders Processed", value: formatNumber(stats?.ordersProcessed ?? 0), description: "Non-draft, non-cancelled orders", icon: BarChart3 },
    { title: "Delivery Rate", value: `${(stats?.deliveryRate ?? 0).toFixed(1)}%`, description: "Delivered / processed orders", icon: Percent },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="TSM Dashboard"
            description="Territory leadership performance from live account and sales records"
          />

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Reporting period">
              {periods.map((period) => {
                const isSelected = period.value === selectedPeriod;
                return (
                  <Button
                    key={period.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label="Refresh TSM dashboard"
                title="Refresh"
                disabled={loading}
                onClick={() => setRefreshing(true)}
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Region</span>
                <select
                  value={selectedRegionId}
                  onChange={(event) => {
                    setSelectedRegionId(event.target.value);
                    setSelectedTerritoryId("");
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="">All regions</option>
                  {dashboard?.regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                </select>
              </label>

              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Territory</span>
                <select
                  value={selectedTerritoryId}
                  onChange={(event) => setSelectedTerritoryId(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="">All territories</option>
                  {visibleTerritories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          {loading && <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading TSM performance...</div>}
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <KpiCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">TSM Snapshot</h2>
              <p className="text-sm text-muted-foreground">Territory leads with distributor and ASR coverage</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["TSM", "REGION", "TERRITORY", "RANK", "DISTRIBUTORS", "ASRS", "REVENUE", "PROCESSED", "DELAYED", "STATUS", "TEAM"].map((column) => (
                      <th key={column} className="px-4 py-3 font-medium text-muted-foreground">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.rows.map((row) => {
                    const expanded = expandedTsmId === row.id;
                    return (
                      <Fragment key={row.id}>
                      <tr className="border-t align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            {row.name}
                            {row.online && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" title="Online now" />}
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            <div>{row.email}</div>
                            <div>{row.phone ?? "No phone recorded"}</div>
                            <div>Last login: {formatDateTime(row.lastLogin)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.region}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.territory}</td>
                        <td className="px-4 py-3 text-muted-foreground">#{row.rank}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatNumber(row.distributors)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatNumber(row.asrs)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatNumber(row.processed)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatNumber(row.delayed)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(row.status)}`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button type="button" variant="outline" size="sm" aria-expanded={expanded} onClick={() => setExpandedTsmId(expanded ? null : row.id)}>{expanded ? "Hide team" : "View team"}</Button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <h3 className="mb-2 text-sm font-semibold">Field agents ({row.team.asrs.length})</h3>
                                {row.team.asrs.length ? (
                                  <ul className="space-y-1 text-sm">
                                    {row.team.asrs.map((member) => <li key={member.id} className="flex justify-between gap-3"><span>{member.name}</span><span className="text-muted-foreground">{member.phone ?? "--"}</span></li>)}
                                  </ul>
                                ) : <p className="text-sm text-muted-foreground">No field agents in this territory yet.</p>}
                              </div>
                              <div>
                                <h3 className="mb-2 text-sm font-semibold">Distributors ({row.team.distributors.length})</h3>
                                {row.team.distributors.length ? (
                                  <ul className="space-y-1 text-sm">
                                    {row.team.distributors.map((distributor) => <li key={distributor.id}>{distributor.name}</li>)}
                                  </ul>
                                ) : <p className="text-sm text-muted-foreground">No distributors in this territory yet.</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {!loading && (dashboard?.rows.length ?? 0) === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">No TSM assignments match this period and location filter.</p>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}