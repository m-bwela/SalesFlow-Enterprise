import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Minus,
  Package,
  Store,
  TrendingUp,
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

import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOutletDashboard, type OutletDashboardData, type OutletDashboardPeriod, type OutletDashboardRow } from "@/services/dashboard.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

const periods: Array<{ label: string; value: OutletDashboardPeriod }> = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "ALL", value: "ALL" },
];

const chartColors = ["#168f72", "#d59032", "#3973ad", "#bf5f55", "#7868a8", "#6c8790"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatCurrencyCompact(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function outletTypeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function RevenueTable({ title, rows }: { title: string; rows: OutletDashboardRow[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
              <tr>{["Outlet", "Type", "Revenue", "Trend", "Phone", "Territory"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((outlet) => (
                <tr key={outlet.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-3 font-medium">{outlet.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{outletTypeLabel(outlet.type)}</td>
                  <td className="px-3 py-3">{formatCurrency(outlet.revenue)}</td>
                  <td className="px-3 py-3">
                    {outlet.trend === "UP" ? <ArrowUpRight className="size-4 text-emerald-600" aria-label="Revenue increased" /> : outlet.trend === "DOWN" ? <ArrowDownRight className="size-4 text-rose-500" aria-label="Revenue decreased" /> : outlet.trend === "FLAT" ? <Minus className="size-4 text-muted-foreground" aria-label="Revenue unchanged" /> : <span className="text-muted-foreground">--</span>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{outlet.phone ?? "--"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{outlet.territory}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No outlet records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenuePie({ title, data, nameKey = "label" }: {
  title: string;
  data: Array<{ label?: string; type?: string; method?: string; value: number }>;
  nameKey?: "label" | "type" | "method";
}) {
  const nonZeroData = data.filter((item) => item.value > 0);

  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {nonZeroData.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No recorded data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={nonZeroData} dataKey="value" nameKey={nameKey} cx="50%" cy="45%" innerRadius={48} outerRadius={82} paddingAngle={2}>
                {nonZeroData.map((item, index) => <Cell key={`${item[nameKey] ?? index}`} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function OutletProfileCard({ outlet }: { outlet: OutletDashboardRow }) {
  const initials = outlet.name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {outlet.imageUrl ? (
        <img src={outlet.imageUrl} alt={`${outlet.name} outlet`} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-muted/40">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">{initials}</span>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{outlet.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{outlet.region} - {outlet.type === "SHOP" ? "Shop" : outletTypeLabel(outlet.type)}</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs">{formatNumber(outlet.orders)} orders</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium">{formatCurrencyCompact(outlet.revenue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function OutletsPage() {
  const [period, setPeriod] = useState<OutletDashboardPeriod>("1M");
  const [dashboard, setDashboard] = useState<OutletDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOutlets() {
      setLoading(true);
      setError(null);
      try {
        const data = await getOutletDashboard(period);
        if (active) setDashboard(data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load outlet data.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOutlets();
    return () => { active = false; };
  }, [period]);

  const stats = dashboard?.stats;
  const kpis = [
    { title: "Total Outlets", value: formatNumber(stats?.totalOutlets ?? 0), description: "Active registered outlets", icon: Store },
    { title: "With Coolers", value: formatNumber(stats?.withCoolers ?? 0), description: "At least one cooler", icon: Store },
    { title: "Without Coolers", value: formatNumber(stats?.withoutCoolers ?? 0), description: "No cooler recorded", icon: Store },
    { title: "Revenue", value: formatCurrencyCompact(stats?.revenue ?? 0, dashboard?.currency), description: `Selected period: ${period}`, icon: TrendingUp },
    { title: "Orders", value: formatNumber(stats?.orders ?? 0), description: `Selected period: ${period}`, icon: BarChart3 },
    { title: "Volume", value: formatNumber(stats?.volume ?? 0), description: "Recorded item quantities", icon: Package },
    { title: "Average Revenue / Outlet", value: formatCurrencyCompact(stats?.averageRevenuePerOutlet ?? 0, dashboard?.currency), description: "Revenue divided by active outlets", icon: TrendingUp },
    { title: "Other", value: formatNumber(stats?.other ?? 0), description: "Outlet type", icon: Store },
    { title: "Shop", value: formatNumber(stats?.shops ?? 0), description: "Outlet type", icon: Store },
    { title: "Restaurant", value: formatNumber(stats?.restaurants ?? 0), description: "Outlet type", icon: Store },
    { title: "Kiosk", value: formatNumber(stats?.kiosks ?? 0), description: "Outlet type", icon: Store },
    { title: "Bar", value: formatNumber(stats?.bars ?? 0), description: "Outlet type", icon: Store },
  ];
  const trendData = (dashboard?.revenueTrend ?? []).map((value, index) => ({ bucket: `${index + 1}`, revenue: value }));

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Outlets" description="Outlet coverage, revenue, and ordering activity" />

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2" role="group" aria-label="Reporting period">
            {periods.map((item) => (
              <button key={item.value} type="button" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {item.label}
              </button>
            ))}
          </div>

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading outlet analytics...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <section aria-label="Outlet KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)}
          </section>

          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle><p className="text-sm text-muted-foreground">Revenue per interval in the selected reporting period</p></CardHeader>
            <CardContent>
              {trendData.some(({ revenue }) => revenue > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trendData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => formatCurrencyCompact(Number(value))} tickLine={false} axisLine={false} width={92} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), dashboard?.currency)} labelFormatter={(label) => `Interval ${label}`} />
                    <Bar dataKey="revenue" name="Revenue" fill="#168f72" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-sm text-muted-foreground">No outlet revenue recorded for this period.</p>}
            </CardContent>
          </Card>

          <section className="grid gap-5 xl:grid-cols-2">
            <RevenueTable title="Top ten Outlets By Revenue" rows={dashboard?.topTen ?? []} />
            <RevenueTable title="Bottom 10 Outlets By Revenue" rows={dashboard?.bottomTen ?? []} />
          </section>

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <RevenuePie title="Revenue By Outlet Type" data={dashboard?.revenueByType ?? []} nameKey="type" />
            <RevenuePie title="Revenue By Payment Method" data={dashboard?.revenueByPaymentMethod.map(({ method, value }) => ({ method, value })) ?? []} nameKey="method" />
            <RevenuePie title="Outlets W/ Coolers - Rev < KES 5,000/Mo" data={dashboard?.coolerRevenueRisk ?? []} />
            <RevenuePie title="Outlets with 3 or fewer orders" data={dashboard?.lowOrderCounts ?? []} />
          </section>

          <section aria-labelledby="outlet-profiles-title" className="space-y-4">
            <div>
              <h2 id="outlet-profiles-title" className="text-lg font-semibold">Outlet Profiles</h2>
              <p className="text-sm text-muted-foreground">Active outlets in this organization</p>
            </div>
            {dashboard?.outlets.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.outlets.map((outlet) => <OutletProfileCard key={outlet.id} outlet={outlet} />)}
              </div>
            ) : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No outlets recorded yet.</CardContent></Card>}
          </section>

          <Card>
            <CardHeader><CardTitle>Outlets Snapshot</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["#", "Outlet", "Code", "Type", "Territory", "Distributor", "Created by (ASR)", "Revenue", "Orders", "Coolers"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(dashboard?.outlets ?? []).map((outlet, index) => (
                      <tr key={outlet.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-3 font-medium">{outlet.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{outlet.code}</td>
                        <td className="px-3 py-3">{outletTypeLabel(outlet.type)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{outlet.territory}</td>
                        <td className="px-3 py-3 text-muted-foreground">{outlet.distributor}</td>
                        <td className="px-3 py-3 text-muted-foreground">{outlet.createdBy}</td>
                        <td className="px-3 py-3">{formatCurrency(outlet.revenue, dashboard?.currency)}</td>
                        <td className="px-3 py-3">{formatNumber(outlet.orders)}</td>
                        <td className="px-3 py-3">{formatNumber(outlet.coolerCount)}</td>
                      </tr>
                    ))}
                    {!loading && (dashboard?.outlets.length ?? 0) === 0 && <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No outlet records found.</td></tr>}
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
