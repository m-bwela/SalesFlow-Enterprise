import { useEffect, useState } from "react";

import { getAdminDashboard } from "@/services/dashboard.service";
import type { AdminDashboardData } from "@/services/dashboard.service";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPinned,
  Package,
  Percent,
  Route,
  ShoppingCart,
  Store,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import { PageContainer } from "../../components/layout/PageContainer";

import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardFilters as DashboardFiltersComponent } from "@/components/dashboard/DashboardFilter";
import type { DashboardFilters } from "@/types/dashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpiMetrics = [
  { title: "Total Revenue", value: "KES 84.6M", description: "+14.2% vs last month", icon: DollarSign },
  { title: "Total Volume", value: "1.2M kg", description: "+8.6% in demand", icon: Package },
  { title: "Total Orders", value: "18,430", description: "Across all channels", icon: ShoppingCart },
  { title: "Average Order Value", value: "KES 4,590", description: "+6.4% uplift", icon: Wallet },
  { title: "Active Outlets", value: "492", description: "89.4% coverage", icon: Store },
  { title: "Delivery Rate", value: "96.8%", description: "On-time fulfillment", icon: Truck },
  { title: "Outlet Sales", value: "KES 39.1M", description: "Outlet channel mix", icon: BarChart3 },
  { title: "TSM Orders", value: "7,420", description: "Active territory sales", icon: Users },
  { title: "Delivered", value: "16,820", description: "Completed shipments", icon: CheckCircle2 },
  { title: "Cancelled", value: "321", description: "Low variance", icon: XCircle },
  { title: "Route Coverage", value: "91.3%", description: "Planned routes covered", icon: Route },
];

const revenueTrend = [24, 42, 38, 56, 64, 72, 68, 84, 92, 80, 102, 118];
const orderTrend = [12, 18, 16, 21, 26, 24, 29, 33, 31, 38, 42, 48];

const productRevenue = [
  { label: "Beverages", value: 35, color: "#34d399" },
  { label: "Bakery", value: 22, color: "#60a5fa" },
  { label: "Household", value: 18, color: "#fbbf24" },
  { label: "Snacks", value: 15, color: "#a78bfa" },
  { label: "Other", value: 10, color: "#f97316" },
];

const territoryPerformance = [
  { label: "Coast", value: 92 },
  { label: "Nairobi", value: 88 },
  { label: "Central", value: 81 },
  { label: "Western", value: 76 },
  { label: "Rift Valley", value: 73 },
];

const routePerformance = [
  { label: "Nairobi", value: 94 },
  { label: "Mombasa", value: 89 },
  { label: "Kisumu", value: 82 },
  { label: "Nyeri", value: 78 },
  { label: "Nakuru", value: 74 },
];

const aovTrend = [18, 22, 21, 28, 32, 34, 36, 38, 41, 46, 44, 51];

const topAgents = [
  { name: "Grace Wanjiku", metric: "KES 9.8M" },
  { name: "Daniel Otieno", metric: "KES 8.4M" },
  { name: "Mary Kamau", metric: "KES 7.9M" },
];

const topDistributors = [
  { name: "Mombasa Hub", metric: "KES 12.6M" },
  { name: "Nairobi East", metric: "KES 11.3M" },
  { name: "Kisumu Central", metric: "KES 9.1M" },
];

const topRoutes = [
  { name: "Coast Urban Loop", metric: "97% on-time" },
  { name: "North Nairobi West", metric: "93% completion" },
  { name: "Western Retail Run", metric: "90% coverage" },
];

const topTerritories = [
  "Coast",
  "Nairobi",
  "Central",
  "Western",
  "Rift Valley",
];

const alerts = [
  "Two territories are below target for outlet conversion this week.",
  "Three distributors need replenishment follow-up before Friday closeout.",
  "Route compliance is improving, but Mombasa still needs recovery support.",
];

function MiniAreaChart({
  data,
  stroke,
  fill,
  height = 120,
}: {
  data: number[];
  stroke: string;
  fill: string;
  height?: number;
}) {
  const width = 320;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 22) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
      <defs>
        <linearGradient id={`fill-${stroke.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.45} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#fill-${stroke.replace("#", "")})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "1M" });

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await getAdminDashboard(filters);
        setDashboard(data);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [filters]);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="Sales Intelligence"
            description="System-wide sales and operational overview"
            showActions
          />

          {loading && (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading dashboard...</div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              {error}
            </div>
          )}

          <DashboardFiltersComponent
            onApply={(nextFilters: DashboardFilters) => {
              setFilters(nextFilters);
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpiMetrics.map((metric) => (
              <KpiCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                description={metric.description}
                icon={metric.icon}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Revenue & Orders Trend</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Revenue</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Orders</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Revenue</span>
                    <span className="font-medium text-emerald-400">+18.4%</span>
                  </div>
                  <MiniAreaChart data={revenueTrend} stroke="#34d399" fill="#34d399" />
                </div>

                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Orders</span>
                    <span className="font-medium text-blue-400">+9.2%</span>
                  </div>
                  <MiniAreaChart data={orderTrend} stroke="#60a5fa" fill="#60a5fa" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
            <Card>
              <CardHeader>
                <CardTitle>Product by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div
                    className="relative h-36 w-36 rounded-full"
                    style={{
                      background: `conic-gradient(${productRevenue
                        .map((item, index) => {
                          const start = productRevenue.slice(0, index).reduce((sum, val) => sum + val.value, 0);
                          const end = start + item.value;
                          return `${item.color} ${start}% ${end}%`;
                        })
                        .join(", ")})`,
                    }}
                  >
                    <div className="absolute inset-7 rounded-full bg-background" />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                      KES 84.6M
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    {productRevenue.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Territory Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {territoryPerformance.map((territory) => (
                  <div key={territory.label}>
                    <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{territory.label}</span>
                      <span className="text-foreground">{territory.value}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-primary to-emerald-400"
                        style={{ width: `${territory.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Route Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {routePerformance.map((route) => (
                  <div key={route.label}>
                    <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{route.label}</span>
                      <span className="text-foreground">{route.value}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        style={{ width: `${route.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">KES 4,590</p>
                    <p className="text-xs text-muted-foreground">+6.4% vs previous period</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <MiniAreaChart data={aovTrend} stroke="#22c55e" fill="#22c55e" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Top Agents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topAgents.map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {agent.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{agent.metric}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Distributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topDistributors.map((distributor) => (
                  <div key={distributor.name} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-400">
                        {distributor.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{distributor.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{distributor.metric}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Routes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topRoutes.map((route) => (
                  <div key={route.name} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-400">
                        {route.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{route.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{route.metric}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {topTerritories.map((territory, index) => (
                  <div key={territory} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>#{index + 1}</span>
                      <MapPinned className="h-3.5 w-3.5" />
                    </div>
                    <p className="font-semibold">{territory}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Strong outlet momentum</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts & Expectations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-amber-400" />
                    <p className="text-sm text-muted-foreground">{alert}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                  Expectation: revenue should exceed KES 90M with improved route compliance and reduced cancellations by the next reporting cycle.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
