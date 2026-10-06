import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Factory,
  Gauge,
  Package,
  Percent,
  Store,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getModernTradeDashboard,
  type ModernTradeData,
  type ModernTradePeriod,
  type ModernTradeRow,
} from "@/services/dashboard.service";

const periods: Array<{ label: string; value: ModernTradePeriod }> = [
  { label: "LIVE", value: "LIVE" },
  { label: "1H", value: "1H" },
  { label: "6H", value: "6H" },
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "2Y", value: "2Y" },
  { label: "3Y", value: "3Y" },
  { label: "ALL", value: "ALL" },
];

type SortKey = "revenue" | "orders" | "outlets" | "factoryOrders" | "name";

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Sort by revenue", value: "revenue" },
  { label: "Sort by orders", value: "orders" },
  { label: "Sort by outlets", value: "outlets" },
  { label: "Sort by factory orders", value: "factoryOrders" },
  { label: "Sort by name", value: "name" },
];

// Card widths on a 12-column grid (large screens). Each row of four adds up to 12.
const kpiSpans = [
  "xl:col-span-3", "xl:col-span-3", "xl:col-span-2", "xl:col-span-4",
  "xl:col-span-3", "xl:col-span-2", "xl:col-span-3", "xl:col-span-4",
  "xl:col-span-3", "xl:col-span-2", "xl:col-span-4", "xl:col-span-3",
];

const LIVE_REFRESH_MS = 30_000;
const selectClass = "h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatCurrencyCompact(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function sortRows(rows: ModernTradeRow[], sortBy: SortKey) {
  return [...rows].sort((left, right) => {
    if (sortBy === "name") return left.name.localeCompare(right.name);
    return right[sortBy] - left[sortBy] || right.revenue - left.revenue || left.name.localeCompare(right.name);
  });
}

export function ModernTradePage() {
  const [period, setPeriod] = useState<ModernTradePeriod>("1M");
  const [regionId, setRegionId] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [mtsrId, setMtsrId] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("revenue");
  const [dashboard, setDashboard] = useState<ModernTradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only the newest request is allowed to update the screen, so a slow older response cannot overwrite a newer one.
  const latestRequest = useRef(0);

  const load = useCallback(async (silent: boolean) => {
    const requestId = ++latestRequest.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getModernTradeDashboard({
        period,
        regionId: regionId || undefined,
        territoryId: territoryId || undefined,
        mtsrId: mtsrId || undefined,
      });
      if (requestId === latestRequest.current) setDashboard(data);
    } catch (requestError) {
      if (requestId === latestRequest.current) setError(requestError instanceof Error ? requestError.message : "Could not load modern trade data.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [period, regionId, territoryId, mtsrId]);

  useEffect(() => {
    void load(false);
    if (period !== "LIVE") return undefined;
    const timer = window.setInterval(() => void load(true), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load, period]);

  const regions = dashboard?.options.regions ?? [];
  const territories = regions.find((region) => region.id === regionId)?.territories ?? regions.flatMap((region) => region.territories);
  const mtsrOptions = (dashboard?.options.mtsrs ?? []).filter((rep) =>
    (!regionId || rep.regionId === regionId) && (!territoryId || rep.territoryId === territoryId),
  );
  const rows = useMemo(() => sortRows(dashboard?.rows ?? [], sortBy), [dashboard, sortBy]);

  const stats = dashboard?.stats;
  const currency = dashboard?.currency;
  const kpis = [
    { title: "Total MTSRs", value: formatNumber(stats?.totalMtsrs ?? 0), description: "Modern trade reps in view", icon: Users },
    { title: "Active", value: formatNumber(stats?.activeMtsrs ?? 0), description: "Accounts currently active", icon: Activity },
    { title: "Online Now", value: formatNumber(stats?.onlineNow ?? 0), description: "Active in the last 5 min", icon: Wifi },
    { title: "Revenue", value: formatCurrencyCompact(stats?.revenue ?? 0, currency), description: `Selected period: ${period}`, icon: TrendingUp },
    { title: "Orders", value: formatNumber(stats?.orders ?? 0), description: "Confirmed orders placed by reps", icon: BarChart3 },
    { title: "Volume", value: formatNumber(stats?.volume ?? 0), description: "Recorded item quantities", icon: Package },
    { title: "Outlets", value: formatNumber(stats?.outlets ?? 0), description: "Registered by these reps", icon: Store },
    { title: "Outlets Ordering", value: formatNumber(stats?.outletsOrdering ?? 0), description: "Outlets with orders this period", icon: Store },
    { title: "Factory Orders", value: formatNumber(stats?.factoryOrders ?? 0), description: "Supplied directly from the factory", icon: Factory },
    { title: "Factory Share", value: `${formatNumber(stats?.factoryShare ?? 0)}%`, description: "Factory orders / all orders", icon: Percent },
    { title: "Average Revenue / MTSR", value: formatCurrencyCompact(stats?.averageRevenuePerMtsr ?? 0, currency), description: "Revenue per active MTSR", icon: TrendingUp },
    { title: "Average Order Value", value: formatCurrencyCompact(stats?.averageOrderValue ?? 0, currency), description: "Revenue per order", icon: Gauge },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Modern Trade" description="Channel performance across MTSRs, customers, Outlets, orders and supply" />

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2" role="group" aria-label="Reporting period">
            {periods.map((item) => (
              <button key={item.value} type="button" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {item.value === "LIVE" && <span className={`mr-1.5 inline-block size-1.5 rounded-full ${period === "LIVE" ? "animate-pulse bg-emerald-300" : "bg-emerald-500"}`} />}
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filters">
            <select aria-label="Region" className={selectClass} value={regionId} onChange={(event) => { setRegionId(event.target.value); setTerritoryId(""); setMtsrId(""); }}>
              <option value="">All Regions</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </select>
            <select aria-label="Territory" className={selectClass} value={territoryId} onChange={(event) => { setTerritoryId(event.target.value); setMtsrId(""); }}>
              <option value="">All Territories</option>
              {territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
            </select>
            <select aria-label="MTSR view" className={selectClass} value={mtsrId} onChange={(event) => setMtsrId(event.target.value)}>
              <option value="">All MTSRs</option>
              {mtsrOptions.map((rep) => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
            </select>
            <select aria-label="Sort by" className={selectClass} value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {period === "LIVE" && <span className="text-xs text-muted-foreground">Showing today so far. Refreshes every 30 seconds.</span>}
          </div>

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading modern trade performance...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {!loading && !error && dashboard && dashboard.stats.totalMtsrs > 0 && dashboard.stats.orders === 0 && (
            <p role="status" className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">No saved sales orders from these MTSRs match {period}. Revenue and order totals use recorded orders.</p>
          )}

          <section aria-label="Modern trade KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {kpis.map((kpi, index) => <div key={kpi.title} className={kpiSpans[index]}><KpiCard {...kpi} /></div>)}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>MTSR Snapshot</CardTitle>
              <p className="text-sm text-muted-foreground">Modern Trade reps ranked by channel performance</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["#", "Rep", "Region", "Territory", "Revenue", "Outlets", "Orders", "Factory Orders"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 font-medium">
                            {row.name}
                            {row.online && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" title="Online now" />}
                            {row.status !== "ACTIVE" && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">Inactive</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{row.phone ?? row.email}</div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{row.region}</td>
                        <td className="px-3 py-3 text-muted-foreground">{row.territory}</td>
                        <td className="px-3 py-3">{formatCurrency(row.revenue, currency)}</td>
                        <td className="px-3 py-3">{formatNumber(row.outlets)}</td>
                        <td className="px-3 py-3">{formatNumber(row.orders)}</td>
                        <td className="px-3 py-3">{formatNumber(row.factoryOrders)}</td>
                      </tr>
                    ))}
                    {!loading && rows.length === 0 && (
                      <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No MTSRs match these filters. Register a user with the Mtsr role and approve them to see them here.</td></tr>
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
