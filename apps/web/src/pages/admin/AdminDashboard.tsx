import { useEffect, useState } from "react";
import {
  Activity,
  MapPinned,
  Package,
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

function trendChange(values: number[]) {
  if (values.length < 2) {
    return "Not enough history yet";
  }

  const change = (values.at(-1) ?? 0) - (values.at(-2) ?? 0);
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatNumber(change)} vs prior interval`;
}

function MiniAreaChart({ data, color }: { data: number[]; color: string }) {
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
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label="Historical record count trend">
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
    { title: "Active Users", value: dashboard?.users ?? 0, description: "Active accounts", icon: Users },
    { title: "Online Users", value: dashboard?.onlineUsers ?? 0, description: "Active in the last 5 minutes", icon: UserCheck },
    { title: "Organizations", value: dashboard?.organizations ?? 0, description: "Active organizations", icon: Activity },
    { title: "Regions", value: dashboard?.regions ?? 0, description: "Active regions", icon: MapPinned },
    { title: "Territories", value: dashboard?.territories ?? 0, description: "Active territories", icon: MapPinned },
    { title: "Distributors", value: dashboard?.distributors ?? 0, description: "Active distributors", icon: Truck },
    { title: "Warehouses", value: dashboard?.warehouses ?? 0, description: "Active warehouses", icon: Package },
    { title: "Memberships", value: dashboard?.memberships ?? 0, description: "Active organization memberships", icon: UserCheck },
    { title: "Users Added", value: dashboard?.newUsers ?? 0, description: `During ${filters.period}`, icon: Users },
    { title: "Organizations Added", value: dashboard?.newOrganizations ?? 0, description: `During ${filters.period}`, icon: Activity },
  ];
  const userTrend = dashboard?.userTrend ?? Array.from({ length: 12 }, () => 0);
  const organizationTrend = dashboard?.organizationTrend ?? Array.from({ length: 12 }, () => 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="Business Overview"
            description="Live account and organization activity"
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <KpiCard
                key={metric.title}
                title={metric.title}
                value={formatNumber(metric.value)}
                description={metric.description}
                icon={metric.icon}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Account Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Users added</span>
                    <span className="font-medium text-emerald-500">{trendChange(userTrend)}</span>
                  </div>
                  <MiniAreaChart data={userTrend} color="#34d399" />
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Organizations added</span>
                    <span className="font-medium text-blue-500">{trendChange(organizationTrend)}</span>
                  </div>
                  <MiniAreaChart data={organizationTrend} color="#60a5fa" />
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            Revenue, orders, products, and delivery metrics will appear when those records are added to the database.
          </p>
        </div>
      </PageContainer>
    </AppShell>
  );
}
