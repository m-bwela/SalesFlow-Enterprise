import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Gauge,
  MapPinned,
  Minus,
  Package,
  Percent,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDistributorDashboard,
  type DistributorDashboardData,
  type DistributorDashboardPeriod,
  type DistributorDashboardRow,
} from "@/services/dashboard.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

const periods: Array<{ label: string; value: DistributorDashboardPeriod }> = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "ALL", value: "ALL" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatCurrencyCompact(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function formatTrendPercent(value: number | null) {
  if (value === null) return "No prior-period baseline";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function DistributorRankingTable({
  title,
  rows,
}: {
  title: string;
  rows: DistributorDashboardRow[];
}) {
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
              <tr>{["#", "Distributor", "Revenue", "Change", "Phone", "Region", "Territory", "Trend"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((distributor, index) => (
                <tr key={distributor.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-3 font-medium">{distributor.name}</td>
                  <td className="px-3 py-3">{formatCurrency(distributor.revenue)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatTrendPercent(distributor.trendPercent)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{distributor.phone ?? "--"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{distributor.region}</td>
                  <td className="px-3 py-3 text-muted-foreground">{distributor.territory}</td>
                  <td className="px-3 py-3">
                    {distributor.trend === "UP" ? <ArrowUpRight className="size-4 text-emerald-600" aria-label="Revenue increased" /> : distributor.trend === "DOWN" ? <ArrowDownRight className="size-4 text-rose-500" aria-label="Revenue decreased" /> : distributor.trend === "FLAT" ? <Minus className="size-4 text-muted-foreground" aria-label="Revenue unchanged" /> : <span className="text-xs text-muted-foreground">--</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No distributor records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DistributorsPage() {
  const [period, setPeriod] = useState<DistributorDashboardPeriod>("1M");
  const [dashboard, setDashboard] = useState<DistributorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDistributorDashboard(period);
        if (active) setDashboard(data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load distributor data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, [period]);

  const stats = dashboard?.stats;
  const kpis = [
    { title: "Total Distributors", value: formatNumber(stats?.totalDistributors ?? 0), description: "Registered in this organization", icon: Users },
    { title: "Active", value: formatNumber(stats?.activeDistributors ?? 0), description: "Currently active", icon: Activity },
    { title: "Inactive", value: formatNumber(stats?.inactiveDistributors ?? 0), description: "Currently inactive", icon: Store },
    { title: "Revenue", value: formatCurrencyCompact(stats?.revenue ?? 0, dashboard?.currency), description: `Selected period: ${period}`, icon: TrendingUp },
    { title: "Orders", value: formatNumber(stats?.orders ?? 0), description: `Selected period: ${period}`, icon: BarChart3 },
    { title: "Volume", value: formatNumber(stats?.volume ?? 0), description: "Recorded item quantities", icon: Package },
    { title: "Average Revenue / Dist", value: formatCurrencyCompact(stats?.averageRevenuePerDistributor ?? 0, dashboard?.currency), description: "Revenue per active distributor", icon: TrendingUp },
    { title: "Average Orders / Dist", value: formatNumber(stats?.averageOrdersPerDistributor ?? 0), description: "Orders per active distributor", icon: BarChart3 },
    { title: "Stocks at hand", value: stats?.stocksAtHand === null ? "Not tracked" : formatNumber(stats?.stocksAtHand ?? 0), description: "No stock ledger is configured", icon: Boxes },
    { title: "Healthy", value: stats?.healthy === null ? "Not tracked" : formatNumber(stats?.healthy ?? 0), description: "No stock health rules are configured", icon: Gauge },
    { title: "Warning", value: stats?.warning === null ? "Not tracked" : formatNumber(stats?.warning ?? 0), description: "No stock health rules are configured", icon: Percent },
    { title: "At Risk / Critical", value: stats?.atRisk === null ? "Not tracked" : formatNumber(stats?.atRisk ?? 0), description: "No stock health rules are configured", icon: Package },
  ];
  const stockTrackingAvailable = dashboard?.stockTrackingAvailable ?? false;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Distributor" description="Distributor performance, coverage, and sales overview" />

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2" role="group" aria-label="Reporting period">
            {periods.map((item) => (
              <button key={item.value} type="button" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {item.label}
              </button>
            ))}
          </div>

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading distributor performance...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {!loading && !error && dashboard?.stats.orders === 0 && (
            <p role="status" className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">No saved sales orders match {period}. Sales totals and revenue trends use recorded orders.</p>
          )}

          <section aria-label="Distributor KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)}
          </section>

          {!stockTrackingAvailable && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Warehouse className="size-4" />Stock counts and health categories are not available until inventory tracking is connected.</p>
          )}

          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle><p className="text-sm text-muted-foreground">Revenue per interval in the selected reporting period</p></CardHeader>
            <CardContent>
              {dashboard?.revenueTrend.some(({ revenue }) => revenue > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.revenueTrend} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => formatCurrencyCompact(Number(value), dashboard.currency)} tickLine={false} axisLine={false} width={92} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), dashboard.currency)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#168f72" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-sm text-muted-foreground">No distributor revenue recorded for this period.</p>}
            </CardContent>
          </Card>

          <section className="grid gap-5 xl:grid-cols-2">
            <DistributorRankingTable title="Top 10 Distributors by Revenue" rows={dashboard?.topTen ?? []} />
            <DistributorRankingTable title="Bottom 10 Distributors by Revenue" rows={dashboard?.bottomTen ?? []} />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Distributor Snapshot</CardTitle>
              <p className="text-sm text-muted-foreground">Revenue and order activity for the selected period</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["#", "Distributor", "Code", "Region", "Territory", "Warehouses", "Revenue", "Orders", "Volume", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(dashboard?.distributors ?? []).map((distributor, index) => (
                      <tr key={distributor.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-3 font-medium">{distributor.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{distributor.code}</td>
                        <td className="px-3 py-3 text-muted-foreground">{distributor.region}</td>
                        <td className="px-3 py-3 text-muted-foreground">{distributor.territory}</td>
                        <td className="px-3 py-3">{formatNumber(distributor.warehouses)}</td>
                        <td className="px-3 py-3">{formatCurrency(distributor.revenue, dashboard?.currency)}</td>
                        <td className="px-3 py-3">{formatNumber(distributor.orders)}</td>
                        <td className="px-3 py-3">{formatNumber(distributor.volume)}</td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 ${distributor.active ? "text-emerald-600" : "text-muted-foreground"}`}><span className={`size-1.5 rounded-full ${distributor.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />{distributor.active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {!loading && (dashboard?.distributors.length ?? 0) === 0 && <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No distributors found in this organization.</td></tr>}
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