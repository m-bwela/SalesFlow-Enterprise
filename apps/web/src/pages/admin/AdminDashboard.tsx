import { useEffect, useState } from "react";
import {
  Activity,
  DollarSign,
  MapPinned,
  Package,
  ShoppingCart,
  Store,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";

import { DashboardFilters as DashboardFiltersComponent } from "@/components/dashboard/DashboardFilter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboard } from "@/services/dashboard.service";
import type { AdminDashboardData } from "@/services/dashboard.service";
import type { DashboardFilters } from "@/types/dashboard";
import { AppShell } from "../../components/layout/AppShell";
import { PageContainer } from "../../components/layout/PageContainer";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function trendChange(values: number[], formatValue: (value: number) => string) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return "Not enough history yet";
  }

  const change = (values.at(-1) ?? 0) - (values.at(-2) ?? 0);
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatValue(change)} vs prior interval`;
}

function MiniAreaChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const width = 320;
  const height = 120;
  const max = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label={`${label} trend`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
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
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminDashboard(filters);
        if (active) {
          setDashboard(data);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        if (active) {
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [filters]);

  const metrics = [
    { title: "Revenue", value: formatCurrency(dashboard?.revenue ?? 0, dashboard?.currency ?? "KES"), description: `Confirmed orders during ${filters.period}`, icon: DollarSign },
    { title: "Orders", value: formatNumber(dashboard?.orders ?? 0), description: `Excludes drafts and cancelled orders`, icon: ShoppingCart },
    { title: "Average Order Value", value: formatCurrency(dashboard?.averageOrderValue ?? 0, dashboard?.currency ?? "KES"), description: "Revenue divided by confirmed orders", icon: Activity },
    { title: "Delivery Rate", value: formatPercent(dashboard?.deliveryRate ?? 0), description: `${formatNumber(dashboard?.deliveredOrders ?? 0)} delivered`, icon: Truck },
    { title: "Active Outlets", value: formatNumber(dashboard?.activeOutlets ?? 0), description: "Active registered outlets", icon: Store },
    { title: "Active Products", value: formatNumber(dashboard?.activeProducts ?? 0), description: "Active catalog products", icon: Package },
    { title: "Cancelled Orders", value: formatNumber(dashboard?.cancelledOrders ?? 0), description: `During ${filters.period}`, icon: Truck },
    { title: "Active Users", value: formatNumber(dashboard?.users ?? 0), description: "Active accounts", icon: Users },
    { title: "Online Users", value: formatNumber(dashboard?.onlineUsers ?? 0), description: "Active in the last 5 minutes", icon: UserCheck },
    { title: "Organizations", value: formatNumber(dashboard?.organizations ?? 0), description: "Active organizations", icon: Activity },
  ];
  const revenueTrend = dashboard?.revenueTrend ?? Array.from({ length: 12 }, () => 0);
  const orderTrend = dashboard?.orderTrend ?? Array.from({ length: 12 }, () => 0);
  const userTrend = dashboard?.userTrend ?? Array.from({ length: 12 }, () => 0);
  const organizationTrend = dashboard?.organizationTrend ?? Array.from({ length: 12 }, () => 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="Sales Intelligence"
            description="Revenue, orders, products, delivery, and account activity"
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

          <DashboardFiltersComponent onApply={setFilters} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
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
              <CardTitle>Revenue & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Revenue</span>
                    <span className="font-medium text-emerald-500">
                      {trendChange(revenueTrend, (value) => formatCurrency(value, dashboard?.currency ?? "KES"))}
                    </span>
                  </div>
                  <MiniAreaChart data={revenueTrend} color="#34d399" label="Revenue" />
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Orders</span>
                    <span className="font-medium text-blue-500">
                      {trendChange(orderTrend, formatNumber)}
                    </span>
                  </div>
                  <MiniAreaChart data={orderTrend} color="#60a5fa" label="Orders" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard?.productsByRevenue.length ? (
                  dashboard.productsByRevenue.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(product.quantity)} units sold{product.category ? ` - ${product.category}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium">
                        {formatCurrency(product.revenue, dashboard.currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No product sales recorded during this period.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Growth Trend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Users added</span>
                    <span>{trendChange(userTrend, formatNumber)}</span>
                  </div>
                  <MiniAreaChart data={userTrend} color="#34d399" label="Users added" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Organizations added</span>
                    <span>{trendChange(organizationTrend, formatNumber)}</span>
                  </div>
                  <MiniAreaChart data={organizationTrend} color="#60a5fa" label="Organizations added" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
