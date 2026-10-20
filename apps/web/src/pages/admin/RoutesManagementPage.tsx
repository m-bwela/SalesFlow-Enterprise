import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, RefreshCw, Search,
  Route as RouteIcon, CheckCircle2, PauseCircle, CalendarDays, CalendarRange, UserCheck, UserX, Store,
  Divide, MapPin, Sparkles, ShoppingCart, Banknote, Package, Users, TrendingUp, Trophy, Medal, Coins,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routeManagementService, type RoutesOverview, type NewRoute } from "@/services/routeManagement.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

const num = (v: number) => Math.round(v).toLocaleString("en-KE");
const kes = (v: number) => `KES ${num(v)}`;
const short = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);
const ALL = "all", NONE = "none";

export function RoutesManagementPage() {
    const [data, setData] = useState<RoutesOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [territory, setTerritory] = useState(ALL);
    const [open, setOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await routeManagementService.getOverview());
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load routes");
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const rows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (data?.routes ?? []).filter((r) => 
        (territory === ALL || r.territoryId === territory) &&
        (!query || [r.name, r.code, r.territory, r.agent].some((v) => v?.toLowerCase().includes(query))));
    }, [data, search, territory]);

    const s = data?.stats;
    const kpis: { label: string; value: React.ReactNode; Icon: LucideIcon; tone: string }[] = s ? [
        { label: "Total Routes", value: num(s.total), Icon: RouteIcon, tone: "bg-primary/10 text-primary" },
        { label: "Active Routes", value: num(s.active), Icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
        { label: "Inactive Routes", value: num(s.inactive), Icon: PauseCircle, tone: "bg-muted text-muted-foreground" },
        { label: "Weekly Routes", value: num(s.weekly), Icon: CalendarDays, tone: "bg-sky-500/10 text-sky-600" },
        { label: "Monthly Routes", value: num(s.monthly), Icon: CalendarRange, tone: "bg-sky-500/10 text-sky-600" },
        { label: "Routes with Agent", value: num(s.withAgent), Icon: UserCheck, tone: "bg-emerald-500/10 text-emerald-600" },
        { label: "Unassigned Routes", value: num(s.unassigned), Icon: UserX, tone: "bg-amber-500/10 text-amber-600" },
        { label: "Outlets on Routes", value: num(s.outletsOnRoutes), Icon: Store, tone: "bg-primary/10 text-primary" },
        { label: "Avg Outlets / Route", value: s.avgOutletsPerRoute.toFixed(1), Icon: Divide, tone: "bg-primary/10 text-primary" },
        { label: "Territories Covered", value: num(s.territoriesCovered), Icon: MapPin, tone: "bg-violet-500/10 text-violet-600" },
        { label: "New Routes · Month", value: num(s.newThisMonth), Icon: Sparkles, tone: "bg-violet-500/10 text-violet-600" },
        { label: "Orders · 7d", value: num(s.orders7d), Icon: ShoppingCart, tone: "bg-sky-500/10 text-sky-600" },
        { label: "Revenue · 7d", value: kes(s.revenue7d), Icon: Banknote, tone: "bg-emerald-500/10 text-emerald-600" },
        { label: "Volume · 7d", value: num(s.volume7d), Icon: Package, tone: "bg-amber-500/10 text-amber-600" },
        { label: "Active Agents · 7d", value: num(s.activeAgents7d), Icon: Users, tone: "bg-primary/10 text-primary" },
        { label: "Avg Revenue / Route · 30d", value: kes(s.avgRevenuePerRoute30d), Icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-600" },
        { label: "Avg Orders / Route · 30d", value: s.avgOrdersPerRoute30d.toFixed(1), Icon: ShoppingCart, tone: "bg-sky-500/10 text-sky-600" },
        { label: "Best Route · 30d", value: s.bestRoute30d ?? "—", Icon: Trophy, tone: "bg-amber-500/10 text-amber-600" },
        { label: "Best Agent · 30d", value: s.bestAgent30d ?? "—", Icon: Medal, tone: "bg-amber-500/10 text-amber-600" },
        { label: "Total Revenue · 30d", value: kes(s.totalRevenue30d), Icon: Coins, tone: "bg-emerald-500/10 text-emerald-600" },
    ] : [];

    return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <DashboardHeader title="Routes Management" description="Define and review delivery routes" />
            </div>
            <Button onClick={() => setOpen(true)} className="sm:mt-1"><Plus className="mr-2 h-4 w-4" />New Route</Button>
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Route Metrics</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {data && <span>Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={load} aria-label="Refresh">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {s ? kpis.map(({ label, value, Icon, tone }) => (
                <Card key={label}>
                    <CardContent className="flex items-center gap-3 p-4">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tone)}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="truncate text-xl font-semibold leading-tight" title={String(value)}>{value}</div>
                        <div className="truncate text-xs text-muted-foreground">{label}</div>
                    </div>
                    </CardContent>
                </Card>
                )) : Array.from({ length: 20 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4">
                <div className="h-6 w-14 animate-pulse rounded bg-muted" /><div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
              </CardContent></Card>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Orders Trend · 30d</CardTitle><CardDescription>Daily orders from route outlets</CardDescription></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%"><LineChart data={data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickFormatter={short} interval={4} tickLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip labelFormatter={(label) => short(String(label))} formatter={(v) => [v, "Orders"]} />
                  <Line dataKey="orders" stroke="#0f6b4f" strokeWidth={2} dot={false} />
                </LineChart></ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Revenue Trend · 30d</CardTitle><CardDescription>Daily revenue (KES)</CardDescription></CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickFormatter={short} interval={4} tickLine={false} fontSize={11} />
                  <YAxis width={44} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip labelFormatter={(label) => short(String(label))} formatter={(v) => [kes(Number(v)), "Revenue"]} />
                  <Area dataKey="revenue" stroke="#0f6b4f" fill="#0f6b4f" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart></ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top Routes · 30d</CardTitle><CardDescription>Top 5 by revenue</CardDescription></CardHeader>
              <CardContent className="h-56">
                {data && data.topRoutes.length === 0 ? (
                  <p className="pt-16 text-center text-sm text-muted-foreground">No route orders in the last 30 days.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.topRoutes ?? []} layout="vertical" margin={{ left: 8 }}>
                    <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip formatter={(v) => [kes(Number(v)), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#0f6b4f" radius={[0, 4, 4, 0]} />
                  </BarChart></ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routes" aria-label="Search routes" className="pl-9" />
              </div>
              <Select value={territory} onValueChange={(v) => setTerritory(v ?? ALL)}>
                <SelectTrigger className="sm:w-52" aria-label="Territory">
                    <SelectValue>
                    {territory === ALL
                        ? "All Territories"
                        : data?.territories.find((t) => t.id === territory)?.name ?? "All Territories"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>All Territories</SelectItem>
                    {data?.territories.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
                </Select>
              <Button variant="outline" onClick={() => { setSearch(""); setTerritory(ALL); }}>Reset</Button>
            </div>

            <Card className="overflow-hidden"><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                {["Code", "Route", "Territory", "Agent", "Outlets", "Frequency", "Status", "Orders · 30d", "Revenue · 30d"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.territory ?? "—"}</TableCell>
                    <TableCell>{r.agent ?? <Badge variant="outline">Unassigned</Badge>}</TableCell>
                    <TableCell>{r.outlets}</TableCell>
                    <TableCell>{r.frequency === "WEEKLY" ? "Weekly" : "Monthly"}</TableCell>
                    <TableCell><Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>{r.orders30d}</TableCell>
                    <TableCell className="whitespace-nowrap">{kes(r.revenue30d)}</TableCell>
                  </TableRow>
                ))}
                {data && rows.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {data.routes.length === 0 ? "No routes yet. Create the first one with + New Route." : "No routes match your filters."}
                  </TableCell></TableRow>
                )}
                {!data && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              </TableBody>
            </Table></div></Card>
          </div>
        </div>

        <NewRouteDialog open={open} onClose={() => setOpen(false)} data={data} onCreated={load} />
      </PageContainer>
    </AppShell>
  );
}

function NewRouteDialog({ open, onClose, data, onCreated }: { open: boolean; onClose: () => void; data: RoutesOverview | null; onCreated: () => void }) {
  const blank = { name: "", code: "", frequency: "WEEKLY" as NewRoute["frequency"], territoryId: NONE, agentId: NONE };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (f.name.trim().length < 2 || f.code.trim().length < 2) return;
    setBusy(true);
    try {
      await routeManagementService.createRoute({ ...f, territoryId: f.territoryId === NONE ? null : f.territoryId, agentId: f.agentId === NONE ? null : f.agentId });
      setF(blank); onClose(); onCreated();
    } catch (e) { (e instanceof Error ? e.message : "Could not create route"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Route</DialogTitle><DialogDescription>Define a delivery route. You can assign outlets to it afterwards.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Route name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Code *</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="e.g. MSA-001" /></div>
            <div className="space-y-1"><Label>Territory</Label>
                <Select value={f.territoryId} onValueChange={(v) => setF({ ...f, territoryId: v ?? NONE })}>
                    <SelectTrigger>
                    <SelectValue>
                        {f.territoryId === NONE ? "None" : data?.territories.find((t) => t.id === f.territoryId)?.name ?? "None"}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {data?.territories.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1"><Label>Assigned agent</Label>
                <Select value={f.agentId} onValueChange={(v) => setF({ ...f, agentId: v ?? NONE })}>
                    <SelectTrigger>
                    <SelectValue>
                        {f.agentId === NONE ? "Unassigned" : data?.agents.find((a) => a.id === f.agentId)?.displayName ?? "Unassigned"}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {data?.agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.displayName}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1"><Label>Visit frequency</Label>
                <Select value={f.frequency} onValueChange={(v) => setF({ ...f, frequency: (v ?? "WEEKLY") as NewRoute["frequency"] })}>
                    <SelectTrigger>
                    <SelectValue>{f.frequency === "WEEKLY" ? "Weekly" : "Monthly"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>Create route</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}