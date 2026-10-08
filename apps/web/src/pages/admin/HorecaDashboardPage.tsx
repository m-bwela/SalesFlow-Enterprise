import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Gauge,
  Package,
  ReceiptText,
  Store,
  TrendingUp,
  Users,
  Wifi,
  XCircle,
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
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHorecaDashboard,
  reviewInvoice,
  type ModernTradePeriod,
  type RepChannelData,
  type RepChannelRow,
} from "@/services/dashboard.service";

const periods: Array<{ label: string; value: ModernTradePeriod }> = [
  { label: "LIVE", value: "LIVE" },
  { label: "1H", value: "1H" },
  { label: "3H", value: "3H" },
  { label: "6H", value: "6H" },
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "2W", value: "2W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "2Y", value: "2Y" },
  { label: "3Y", value: "3Y" },
  { label: "ALL", value: "ALL" },
];

type SortKey = "revenue" | "orders" | "outlets" | "pendingInvoices" | "name";

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Sort by revenue", value: "revenue" },
  { label: "Sort by orders", value: "orders" },
  { label: "Sort by outlets", value: "outlets" },
  { label: "Sort by pending invoices", value: "pendingInvoices" },
  { label: "Sort by name", value: "name" },
];

// Card widths on a 12-column grid (large screens). Each row of four adds up to 12.
const kpiSpans = [
  "xl:col-span-3", "xl:col-span-3", "xl:col-span-2", "xl:col-span-4",
  "xl:col-span-3", "xl:col-span-2", "xl:col-span-3", "xl:col-span-4",
  "xl:col-span-3", "xl:col-span-3", "xl:col-span-2", "xl:col-span-4",
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

function getInvoiceStatusStyle(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300";
    case "REJECTED":
      return "bg-destructive/10 text-destructive ring-1 ring-destructive/30";
    default:
      return "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300";
  }
}

function sortRows(rows: RepChannelRow[], sortBy: SortKey) {
  return [...rows].sort((left, right) => {
    if (sortBy === "name") return left.name.localeCompare(right.name);
    return right[sortBy] - left[sortBy] || right.revenue - left.revenue || left.name.localeCompare(right.name);
  });
}

export function HorecaDashboardPage() {
  const [period, setPeriod] = useState<ModernTradePeriod>("1M");
  const [regionId, setRegionId] = useState("");
  const [territoryId, setTerritoryId] = useState("");
  const [repId, setRepId] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("revenue");
  const [dashboard, setDashboard] = useState<RepChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  // Only the newest request is allowed to update the screen, so a slow older response cannot overwrite a newer one.
  const latestRequest = useRef(0);

  const load = useCallback(async (silent: boolean) => {
    const requestId = ++latestRequest.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getHorecaDashboard({
        period,
        regionId: regionId || undefined,
        territoryId: territoryId || undefined,
        repId: repId || undefined,
      });
      if (requestId === latestRequest.current) setDashboard(data);
    } catch (requestError) {
      if (requestId === latestRequest.current) setError(requestError instanceof Error ? requestError.message : "Could not load HORECA data.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [period, regionId, territoryId, repId]);

  useEffect(() => {
    void load(false);
    if (period !== "LIVE") return undefined;
    const timer = window.setInterval(() => void load(true), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load, period]);

  const regions = dashboard?.options.regions ?? [];
  const territories = regions.find((region) => region.id === regionId)?.territories ?? regions.flatMap((region) => region.territories);
  const repOptions = (dashboard?.options.reps ?? []).filter((rep) =>
    (!regionId || rep.regionId === regionId) && (!territoryId || rep.territoryId === territoryId),
  );
  const rows = useMemo(() => sortRows(dashboard?.rows ?? [], sortBy), [dashboard, sortBy]);

  async function act(orderId: string, action: "APPROVE" | "REJECT") {
    setReviewingId(orderId);
    setError(null);
    setNotice(null);
    try {
      await reviewInvoice(orderId, action);
      setNotice(`Invoice ${action === "APPROVE" ? "approved" : "rejected"}.`);
      await load(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this invoice.");
    } finally {
      setReviewingId(null);
    }
  }

  const stats = dashboard?.stats;
  const currency = dashboard?.currency;
  const kpis = [
    { title: "Total HORECA Reps", value: formatNumber(stats?.totalReps ?? 0), description: "Hotel, Restaurant & Cafe reps in view", icon: Users },
    { title: "Active", value: formatNumber(stats?.activeReps ?? 0), description: "Accounts currently active", icon: Activity },
    { title: "Online Now", value: formatNumber(stats?.onlineNow ?? 0), description: "Active in the last 5 min", icon: Wifi },
    { title: "Revenue", value: formatCurrencyCompact(stats?.revenue ?? 0, currency), description: `Selected period: ${period}`, icon: TrendingUp },
    { title: "Orders", value: formatNumber(stats?.orders ?? 0), description: "Approved invoices placed by reps", icon: BarChart3 },
    { title: "Volume", value: formatNumber(stats?.volume ?? 0), description: "Recorded item quantities", icon: Package },
    { title: "Outlets", value: formatNumber(stats?.outlets ?? 0), description: "Hotels, restaurants and cafes registered", icon: Store },
    { title: "Outlets Ordering", value: formatNumber(stats?.outletsOrdering ?? 0), description: "Outlets with orders this period", icon: Store },
    { title: "Pending Invoices", value: formatNumber(stats?.pendingInvoices ?? 0), description: "Awaiting MT_TSM approval", icon: ReceiptText },
    { title: "Approved Invoices", value: formatNumber(stats?.approvedInvoices ?? 0), description: "Confirmed as sales", icon: CheckCircle2 },
    { title: "Average Revenue / Rep", value: formatCurrencyCompact(stats?.averageRevenuePerRep ?? 0, currency), description: "Revenue per active rep", icon: TrendingUp },
    { title: "Average Order Value", value: formatCurrencyCompact(stats?.averageOrderValue ?? 0, currency), description: "Revenue per order", icon: Gauge },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="HORECA Dashboard" description="Channel performance across Hotel, Restaurant & Cafe reps, Depot-sourced orders, and invoices" />

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2" role="group" aria-label="Reporting period">
            {periods.map((item) => (
              <button key={item.value} type="button" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {item.value === "LIVE" && <span className={`mr-1.5 inline-block size-1.5 rounded-full ${period === "LIVE" ? "animate-pulse bg-emerald-300" : "bg-emerald-500"}`} />}
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filters">
            <select aria-label="Region" className={selectClass} value={regionId} onChange={(event) => { setRegionId(event.target.value); setTerritoryId(""); setRepId(""); }}>
              <option value="">All Regions</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </select>
            <select aria-label="Territory" className={selectClass} value={territoryId} onChange={(event) => { setTerritoryId(event.target.value); setRepId(""); }}>
              <option value="">All Territories</option>
              {territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
            </select>
            <select aria-label="HORECA rep view" className={selectClass} value={repId} onChange={(event) => setRepId(event.target.value)}>
              <option value="">All Reps</option>
              {repOptions.map((rep) => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
            </select>
            <select aria-label="Sort by" className={selectClass} value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {period === "LIVE" && <span className="text-xs text-muted-foreground">Showing today so far. Refreshes every 30 seconds.</span>}
          </div>

          {loading && <p className="rounded-md border p-3 text-sm text-muted-foreground">Loading HORECA performance...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          {!loading && !error && dashboard && dashboard.stats.totalReps > 0 && dashboard.stats.orders === 0 && (
            <p role="status" className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">No approved sales orders from these HORECA reps match {period}. Revenue and order totals only count invoices MT_TSM has approved.</p>
          )}

          <section aria-label="HORECA KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {kpis.map((kpi, index) => <div key={kpi.title} className={kpiSpans[index]}><KpiCard {...kpi} /></div>)}
          </section>

          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle><p className="text-sm text-muted-foreground">Approved revenue per interval in the selected reporting period</p></CardHeader>
            <CardContent>
              {dashboard?.revenueTrend.some(({ revenue }) => revenue > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboard.revenueTrend} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(value) => formatCurrencyCompact(Number(value), currency)} tickLine={false} axisLine={false} width={92} />
                    <Tooltip formatter={(value, name) => name === "Revenue" ? formatCurrency(Number(value), currency) : formatNumber(Number(value))} />
                    <Bar dataKey="revenue" name="Revenue" fill="#168f72" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-sm text-muted-foreground">No HORECA revenue recorded for this period.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <p className="text-sm text-muted-foreground">Depot orders placed by HORECA reps, pending MT_TSM approval or already reviewed</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["Rep", "Outlet", "Depot", "Amount", "Date", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(dashboard?.invoices ?? []).map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium">{invoice.repName}</td>
                        <td className="px-3 py-3 text-muted-foreground">{invoice.outlet}</td>
                        <td className="px-3 py-3 text-muted-foreground">{invoice.depot}</td>
                        <td className="px-3 py-3">{formatCurrency(invoice.amount, currency)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{formatDateTime(invoice.orderDate)}</td>
                        <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInvoiceStatusStyle(invoice.status)}`}>{invoice.status}</span></td>
                        <td className="px-3 py-3">
                          {invoice.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <Button type="button" size="sm" variant="outline" disabled={reviewingId === invoice.id} onClick={() => void act(invoice.id, "APPROVE")}><CheckCircle2 className="text-emerald-600" />Approve</Button>
                              <Button type="button" size="sm" variant="outline" disabled={reviewingId === invoice.id} onClick={() => void act(invoice.id, "REJECT")}><XCircle className="text-destructive" />Reject</Button>
                            </div>
                          ) : <span className="text-xs text-muted-foreground">Reviewed</span>}
                        </td>
                      </tr>
                    ))}
                    {!loading && (dashboard?.invoices.length ?? 0) === 0 && (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No invoices recorded for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HORECA Snapshot</CardTitle>
              <p className="text-sm text-muted-foreground">HORECA reps ranked by channel performance</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <tr>{["#", "Rep", "Region", "Territory", "Revenue", "Outlets", "Orders", "Pending Invoices"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
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
                        <td className="px-3 py-3">{formatNumber(row.pendingInvoices)}</td>
                      </tr>
                    ))}
                    {!loading && rows.length === 0 && (
                      <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No HORECA reps match these filters. Register a user with the Horeca role and approve them to see them here.</td></tr>
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
