import { useEffect, useState } from "react";
import {
  Activity,
  DollarSign,
  MapPinned,
  Package,
  Phone,
  ShoppingCart,
  Star,
  Store,
  Truck,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAsrDashboard,
  type AsrDashboardData,
  type AsrDashboardPeriod,
} from "@/services/dashboard.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

const periods: { label: string; value: AsrDashboardPeriod }[] = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "This Week", value: "THIS_WEEK" },
  { label: "Last week", value: "LAST_WEEK" },
  { label: "2W Back", value: "TWO_WEEKS_BACK" },
  { label: "This Month", value: "THIS_MONTH" },
  { label: "All", value: "ALL" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function trendChange(values: number[], formatValue: (value: number) => string) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return "No sales recorded";
  }

  const change = (values.at(-1) ?? 0) - (values.at(-2) ?? 0);
  return `${change > 0 ? "+" : ""}${formatValue(change)} vs previous interval`;
}

function MiniTrend({ data, color, label }: { data: number[]; color: string; label: string }) {
  const width = 320;
  const height = 108;
  const max = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - 12 - (value / max) * (height - 24);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label={`${label} trend`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AsrCard({
  asr,
  currency,
  onViewProfile,
}: {
  asr: AsrDashboardData["asrs"][number];
  currency: string;
  onViewProfile: () => void;
}) {
  return (
    <Card className="group relative overflow-visible transition-shadow hover:shadow-lg">
      <CardContent className="relative p-4">
        <div className="flex items-start gap-3">
          {asr.profileImageUrl ? (
            <img src={asr.profileImageUrl} alt={`${asr.name} profile`} className="size-14 shrink-0 rounded-full object-cover ring-2 ring-border" />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-border">
              {getInitials(asr.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{asr.name}</p>
            <p className="truncate text-xs text-muted-foreground">{asr.email}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-xs ${asr.status === "Active" ? "text-emerald-600" : asr.status === "Suspended" ? "text-destructive" : "text-muted-foreground"}`}>
              <span className={`size-1.5 rounded-full ${asr.status === "Active" ? "bg-emerald-500" : asr.status === "Suspended" ? "bg-destructive" : "bg-muted-foreground"}`} />
              {asr.status}{asr.online ? " - Online" : ""}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Rating is not tracked yet">
            <Star className="size-3.5" />
            {asr.rating ?? "N/A"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            {asr.phoneNumber ? <a href={`tel:${asr.phoneNumber}`} className="truncate hover:text-foreground">{asr.phoneNumber}</a> : <span>Phone not set</span>}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <MapPinned className="size-3.5 shrink-0" />
            <span className="truncate">{asr.region ?? "Region not assigned"}</span>
          </div>
          <div className="truncate text-muted-foreground">Territory: {asr.territory ?? "Not assigned"}</div>
          <div className="truncate text-muted-foreground">Distributor: {asr.distributor ?? "Not assigned"}</div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Crates sold</p>
            <p className="mt-0.5 text-lg font-semibold">{formatNumber(asr.cratesSold)}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onViewProfile}>View profile</Button>
        </div>

        <div className="pointer-events-none absolute inset-2 z-10 flex flex-col justify-end rounded-md border bg-popover/95 p-4 opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Performance details</p>
          <p className="mt-2 text-sm">Revenue: <span className="font-semibold text-foreground">{formatCurrency(asr.revenue, currency)}</span></p>
          <p className="mt-1 text-sm">Orders: <span className="font-semibold text-foreground">{formatNumber(asr.orders)}</span></p>
          <p className="mt-1 text-sm">Visits: <span className="font-semibold text-foreground">{asr.visits ?? "Not tracked"}</span></p>
          <p className="mt-1 text-sm">Coolers: <span className="font-semibold text-foreground">{asr.coolers ?? "Not tracked"}</span></p>
          <p className="mt-3 text-xs text-muted-foreground">Select “View profile” for the full snapshot.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ASRDashboardPage() {
  const [period, setPeriod] = useState<AsrDashboardPeriod>("TODAY");
  const [dashboard, setDashboard] = useState<AsrDashboardData | null>(null);
  const [selectedAsr, setSelectedAsr] = useState<AsrDashboardData["asrs"][number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAsrDashboard(period);
        if (active) setDashboard(data);
      } catch (requestError) {
        console.error("Failed to load ASR dashboard:", requestError);
        if (active) setError("Could not load ASR performance. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [period]);

  const currency = dashboard?.currency ?? "KES";
  const revenueTrend = dashboard?.revenueTrend ?? Array.from({ length: 12 }, () => 0);
  const ordersTrend = dashboard?.ordersTrend ?? Array.from({ length: 12 }, () => 0);
  const metrics = [
    { title: "Total ASRs", value: formatNumber(dashboard?.totalAsrs ?? 0), icon: Users, note: "Assigned representatives" },
    { title: "Active ASRs", value: formatNumber(dashboard?.activeAsrs ?? 0), icon: UserCheck, note: "Active assignments" },
    { title: "Online Now", value: formatNumber(dashboard?.onlineNow ?? 0), icon: Activity, note: "Seen in the last 5 minutes" },
    { title: "Suspended", value: formatNumber(dashboard?.suspendedAsrs ?? 0), icon: Users, note: "Suspended user accounts" },
    { title: "Revenue", value: formatCurrency(dashboard?.revenue ?? 0, currency), icon: DollarSign, note: `For ${periods.find((item) => item.value === period)?.label}` },
    { title: "Selling ASRs", value: formatNumber(dashboard?.sellingAsrs ?? 0), icon: ShoppingCart, note: "At least one order" },
    { title: "Visiting ASRs", value: dashboard?.visitingAsrs == null ? "Not tracked" : formatNumber(dashboard.visitingAsrs), icon: Store, note: "Visit records are not available" },
    { title: "Average Revenue / ASR", value: formatCurrency(dashboard?.averageRevenuePerAsr ?? 0, currency), icon: DollarSign, note: "Revenue divided by active ASRs" },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">ASR Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Field performance Overview</p>
          </header>

          <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1" role="group" aria-label="Performance period">
            {periods.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={period === item.value ? "default" : "ghost"}
                size="sm"
                aria-pressed={period === item.value}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {loading && <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading ASR performance...</div>}
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <section aria-label="ASR key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.title}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="mt-2 truncate text-2xl font-semibold">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
                  </div>
                  <metric.icon className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader><CardTitle>Revenue & Orders Trend</CardTitle></CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Revenue</span><span>{trendChange(revenueTrend, (value) => formatCurrency(value, currency))}</span>
                </div>
                <MiniTrend data={revenueTrend} color="#34d399" label="Revenue" />
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Orders</span><span>{trendChange(ordersTrend, formatNumber)}</span>
                </div>
                <MiniTrend data={ordersTrend} color="#60a5fa" label="Orders" />
              </div>
            </CardContent>
          </Card>

          <section aria-labelledby="asr-team-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 id="asr-team-title" className="text-lg font-semibold">All ASRs</h2>
                <p className="text-sm text-muted-foreground">Profiles and field performance for the selected period</p>
              </div>
              <span className="text-sm text-muted-foreground">{formatNumber(dashboard?.asrs.length ?? 0)} representatives</span>
            </div>
            {dashboard?.asrs.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {dashboard.asrs.map((asr) => (
                  <AsrCard key={asr.id} asr={asr} currency={currency} onViewProfile={() => setSelectedAsr(asr)} />
                ))}
              </div>
            ) : (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No ASR assignments found.</CardContent></Card>
            )}
          </section>

          <Card>
            <CardHeader><CardTitle>ASR Snapshot</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      {["ASR", "Distributor", "Territory", "Revenue", "Crates", "Orders", "Visits", "Coolers", "New outlets", "Status"].map((heading) => (
                        <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard?.asrs.map((asr) => (
                      <tr key={asr.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium">{asr.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">Not scheduled</td>
                        <td className="px-3 py-3 text-muted-foreground">{asr.territory ?? "Not assigned"}</td>
                        <td className="px-3 py-3">{formatCurrency(asr.revenue, currency)}</td>
                        <td className="px-3 py-3">{formatNumber(asr.cratesSold)}</td>
                        <td className="px-3 py-3">{formatNumber(asr.orders)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{asr.visits ?? "Not tracked"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{asr.coolers ?? "Not tracked"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{asr.newOutlets ?? "Not tracked"}</td>
                        <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${asr.status === "Active" ? "bg-emerald-500" : asr.status === "Suspended" ? "bg-destructive" : "bg-muted-foreground"}`} />{asr.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                Visits, coolers, ratings, new-outlet attribution, and upcoming distributor schedules are not recorded in the current system.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      {selectedAsr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedAsr(null);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="asr-profile-title" className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {selectedAsr.profileImageUrl ? (
                  <img src={selectedAsr.profileImageUrl} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{getInitials(selectedAsr.name)}</div>
                )}
                <div className="min-w-0">
                  <h2 id="asr-profile-title" className="truncate text-lg font-semibold">{selectedAsr.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{selectedAsr.email}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close profile" onClick={() => setSelectedAsr(null)}><X /></Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <p className="text-muted-foreground">Phone <span className="block font-medium text-foreground">{selectedAsr.phoneNumber ?? "Not set"}</span></p>
              <p className="text-muted-foreground">Region <span className="block font-medium text-foreground">{selectedAsr.region ?? "Not assigned"}</span></p>
              <p className="text-muted-foreground">Territory <span className="block font-medium text-foreground">{selectedAsr.territory ?? "Not assigned"}</span></p>
              <p className="text-muted-foreground">Distributor <span className="block font-medium text-foreground">{selectedAsr.distributor ?? "Not assigned"}</span></p>
              <p className="text-muted-foreground">Revenue <span className="block font-medium text-foreground">{formatCurrency(selectedAsr.revenue, currency)}</span></p>
              <p className="text-muted-foreground">Orders <span className="block font-medium text-foreground">{formatNumber(selectedAsr.orders)}</span></p>
              <p className="text-muted-foreground">Crates sold <span className="block font-medium text-foreground">{formatNumber(selectedAsr.cratesSold)}</span></p>
              <p className="text-muted-foreground">Rating <span className="block font-medium text-foreground">{selectedAsr.rating ?? "Not tracked"}</span></p>
              <p className="text-muted-foreground">Visits <span className="block font-medium text-foreground">{selectedAsr.visits ?? "Not tracked"}</span></p>
              <p className="text-muted-foreground">Coolers <span className="block font-medium text-foreground">{selectedAsr.coolers ?? "Not tracked"}</span></p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
