import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Gauge,
  RefreshCw,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAgentPerformanceForDay,
  getOrderAnalytics,
  type AgentPerformanceData,
  type OrderAnalyticsData,
  type OrderStatus,
  type TrendGranularity,
} from "@/services/dashboard.service";

const granularityOptions: Array<{ label: string; value: TrendGranularity }> = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PENDING_TSM_REVIEW: "Pending TSM Review",
  APPROVED: "Approved",
  CONFIRMED: "Confirmed",
  RECEIVED: "Received",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: "#d59032",
  PENDING_TSM_REVIEW: "#bf9b55",
  APPROVED: "#3973ad",
  CONFIRMED: "#6c8790",
  RECEIVED: "#7868a8",
  DELIVERED: "#168f72",
  CANCELLED: "#bf5f55",
};

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatCurrencyCompact(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface RankingItem {
  id: string;
  name: string;
  detail?: string;
  revenue: number;
}

function RankingList({ title, items, currency, emptyLabel }: { title: string; items: RankingItem[]; currency: string; emptyLabel: string }) {
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="space-y-2.5">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    {item.detail && <p className="truncate text-xs text-muted-foreground">{item.detail}</p>}
                  </div>
                </div>
                <span className="shrink-0 font-medium">{formatCurrencyCompact(item.revenue, currency)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function OrderAnalyticsPage() {
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftRegionId, setDraftRegionId] = useState("");
  const [draftTerritoryId, setDraftTerritoryId] = useState("");
  const [draftAgentId, setDraftAgentId] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "", regionId: "", territoryId: "", agentId: "" });
  const [granularity, setGranularity] = useState<TrendGranularity>("DAILY");

  const [dashboard, setDashboard] = useState<OrderAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [performanceDate, setPerformanceDate] = useState(() => isoDate(new Date()));
  const [performance, setPerformance] = useState<AgentPerformanceData | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderAnalytics({
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
        regionId: appliedFilters.regionId || undefined,
        territoryId: appliedFilters.territoryId || undefined,
        agentId: appliedFilters.agentId || undefined,
        granularity,
      });
      setDashboard(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load order analytics.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, granularity]);

  useEffect(() => { void load(); }, [load]);

  async function loadAgentPerformance() {
    setPerformanceLoading(true);
    setPerformanceError(null);
    try {
      const data = await getAgentPerformanceForDay(performanceDate);
      setPerformance(data);
    } catch (requestError) {
      setPerformanceError(requestError instanceof Error ? requestError.message : "Could not load agent performance.");
    } finally {
      setPerformanceLoading(false);
    }
  }

  useEffect(() => { void loadAgentPerformance(); }, []);

  const regions = dashboard?.options.regions ?? [];
  const territories = draftRegionId
    ? (dashboard?.options.territories ?? []).filter((territory) => territory.regionId === draftRegionId)
    : dashboard?.options.territories ?? [];
  const agentOptions = (dashboard?.options.agents ?? []).filter((agent) =>
    (!draftRegionId || agent.regionId === draftRegionId) && (!draftTerritoryId || agent.territoryId === draftTerritoryId),
  );

  function applyFilters() {
    setAppliedFilters({ startDate: draftStartDate, endDate: draftEndDate, regionId: draftRegionId, territoryId: draftTerritoryId, agentId: draftAgentId });
  }

  function resetFilters() {
    setDraftStartDate(""); setDraftEndDate(""); setDraftRegionId(""); setDraftTerritoryId(""); setDraftAgentId("");
    setAppliedFilters({ startDate: "", endDate: "", regionId: "", territoryId: "", agentId: "" });
  }

  const stats = dashboard?.stats;
  const currency = dashboard?.currency ?? "KES";
  const kpis = [
    { title: "Today's Orders", value: formatNumber(stats?.todaysOrders ?? 0), description: "Approved orders placed today", icon: BarChart3 },
    { title: "Today's Revenue", value: formatCurrencyCompact(stats?.todaysRevenue ?? 0, currency), description: "Approved revenue today", icon: TrendingUp },
    { title: "This Week", value: formatCurrencyCompact(stats?.thisWeekRevenue ?? 0, currency), description: "Approved revenue this week", icon: TrendingUp },
    { title: "This Month", value: formatCurrencyCompact(stats?.thisMonthRevenue ?? 0, currency), description: "Approved revenue this month", icon: TrendingUp },
    { title: "Average Order Value", value: formatCurrencyCompact(stats?.averageOrderValue ?? 0, currency), description: "Across the selected range", icon: Gauge },
    { title: "Delivery rate", value: formatPercent(stats?.deliveryRate ?? 0), description: "Delivered / approved orders", icon: Truck },
  ];

  const statusPieData = useMemo(
    () => (dashboard?.orderStatusDistribution ?? []).filter(({ count }) => count > 0).map(({ status, count }) => ({ status, name: statusLabels[status], value: count })),
    [dashboard],
  );

  const bestOutlets: RankingItem[] = (dashboard?.bestOutlets ?? []).map((outlet) => ({ id: outlet.id, name: outlet.name, detail: `${formatNumber(outlet.orders)} orders`, revenue: outlet.revenue }));
  const topAgents: RankingItem[] = (dashboard?.topAgents ?? []).map((agent) => ({ id: agent.id, name: agent.name, detail: agent.role, revenue: agent.revenue }));
  const territoryLeaders: RankingItem[] = (dashboard?.territoryLeaders ?? []).map((territory) => ({ id: territory.territoryId, name: territory.territory, revenue: territory.revenue }));

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <DashboardHeader title="Order Analytics" description="Real-Time Order metrics and performance" />
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading} className="shrink-0">
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="pt-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                <label className="space-y-1.5 text-sm">Start Date<Input type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} /></label>
                <label className="space-y-1.5 text-sm">End Date<Input type="date" value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} /></label>
                <label className="space-y-1.5 text-sm">Region
                  <select className={selectClass} value={draftRegionId} onChange={(event) => { setDraftRegionId(event.target.value); setDraftTerritoryId(""); setDraftAgentId(""); }}>
                    <option value="">-- All Regions --</option>
                    {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">Territory
                  <select className={selectClass} value={draftTerritoryId} onChange={(event) => { setDraftTerritoryId(event.target.value); setDraftAgentId(""); }}>
                    <option value="">-- All Territories --</option>
                    {territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">Agent
                  <select className={selectClass} value={draftAgentId} onChange={(event) => setDraftAgentId(event.target.value)}>
                    <option value="">-- All Agents --</option>
                    {agentOptions.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.roleCode})</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                <Button type="button" onClick={applyFilters}>Apply</Button>
              </div>
            </CardContent>
          </Card>

          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading order analytics...</p>}

          <section aria-label="Order KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle>Revenue Trend</CardTitle>
                <div className="flex gap-1 rounded-lg border bg-muted/20 p-1">
                  {granularityOptions.map((option) => (
                    <button key={option.value} type="button" aria-pressed={granularity === option.value} onClick={() => setGranularity(option.value)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${granularity === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {dashboard?.revenueTrend.some(({ revenue }) => revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dashboard.revenueTrend} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(value) => formatCurrencyCompact(Number(value), currency)} tickLine={false} axisLine={false} width={88} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                      <Bar dataKey="revenue" name="Revenue" fill="#168f72" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-14 text-center text-sm text-muted-foreground">No revenue recorded for this range.</p>}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Order Volume</CardTitle>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </CardHeader>
              <CardContent>
                {dashboard?.orderVolumeTrend.some(({ orders }) => orders > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dashboard.orderVolumeTrend} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Bar dataKey="orders" name="Orders" fill="#3973ad" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-14 text-center text-sm text-muted-foreground">No orders recorded in the last 30 days.</p>}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="min-w-0"><CardHeader><CardTitle className="text-base">Revenue Trend Insight</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{dashboard?.insights.revenueTrend ?? "—"}</p></CardContent></Card>
            <Card className="min-w-0"><CardHeader><CardTitle className="text-base">Volume Insight</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{dashboard?.insights.volume ?? "—"}</p></CardContent></Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader><CardTitle>Territory Performance</CardTitle></CardHeader>
              <CardContent>
                {dashboard?.territoryPerformance.some(({ revenue }) => revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboard.territoryPerformance} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => formatCurrencyCompact(Number(value), currency)} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="territory" tickLine={false} axisLine={false} width={110} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                      <Bar dataKey="revenue" name="Revenue" fill="#7868a8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-14 text-center text-sm text-muted-foreground">No territory revenue recorded for this range.</p>}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {statusPieData.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">No orders recorded for this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={48} outerRadius={88} paddingAngle={2}>
                        {statusPieData.map((entry) => <Cell key={entry.status} fill={statusColors[entry.status]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="min-w-0"><CardHeader><CardTitle className="text-base">Territory Performance Insight</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{dashboard?.insights.territoryPerformance ?? "—"}</p></CardContent></Card>
            <Card className="min-w-0"><CardHeader><CardTitle className="text-base">Order Status Insight</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{dashboard?.insights.orderStatus ?? "—"}</p></CardContent></Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <RankingList title="Best Outlets" items={bestOutlets} currency={currency} emptyLabel="No outlet revenue recorded for this range." />
            <RankingList title="Top Agents" items={topAgents} currency={currency} emptyLabel="No agent revenue recorded for this range." />
            <RankingList title="Territory Leaders" items={territoryLeaders} currency={currency} emptyLabel="No territory revenue recorded for this range." />
          </section>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Agent Performance - Time at outlets</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {performance ? `${formatNumber(performance.activeAgentCount)} agent(s) active on ${performance.date}` : "Choose a date and press Load."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <Input type="date" value={performanceDate} onChange={(event) => setPerformanceDate(event.target.value)} className="w-auto" />
                </div>
                <Button type="button" onClick={() => void loadAgentPerformance()} disabled={performanceLoading}>{performanceLoading ? "Loading..." : "Load"}</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {performanceError && <p role="alert" className="px-6 py-3 text-sm text-destructive">{performanceError}</p>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["Agent", "Route", "Outlets", "Total Time", "Avg/Outlet", "Revenue", "Start", "End"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(performance?.rows ?? []).map((row) => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium">{row.name}<span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.role}</span></td>
                        <td className="px-3 py-3 text-muted-foreground">{row.route ?? "Not tracked"}</td>
                        <td className="px-3 py-3">{formatNumber(row.outlets)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{row.totalTime ?? "Not tracked"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{row.averagePerOutlet ?? "Not tracked"}</td>
                        <td className="px-3 py-3">{formatCurrency(row.revenue, performance?.currency)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{row.start ?? "Not tracked"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{row.end ?? "Not tracked"}</td>
                      </tr>
                    ))}
                    {!performanceLoading && (performance?.rows.length ?? 0) === 0 && (
                      <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No agents were active on this date.</td></tr>
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
