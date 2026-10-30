import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Pencil, Search, Target as TargetIcon, TrendingUp, CheckCircle2, AlertTriangle, CircleSlash, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { targetsService, type Metrics, type TargetLevel, type TargetRow, type TargetsOverview } from "@/services/targets.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

const num = (v: number) => Math.round(v).toLocaleString("en-KE");
const kes = (v: number) => `KES ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
const LEVELS: { key: TargetLevel; label: string; noun: string }[] = [
  { key: "REGION", label: "Regions", noun: "region" }, { key: "TERRITORY", label: "Territories", noun: "territory" }, { key: "ASR", label: "ASRs", noun: "agent" },
];
const METRICS: { key: keyof Metrics; label: string; fmt: (v: number) => string }[] = [
  { key: "revenue", label: "Revenue (KES)", fmt: kes }, { key: "volume", label: "Volume", fmt: num },
  { key: "orders", label: "Orders", fmt: num }, { key: "newOutlets", label: "New outlets", fmt: num },
];

// Nairobi month, "YYYY-MM"
const thisMonth = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 7);
const shiftMonth = (m: string, by: number) => { const [y, mo] = m.split("-").map(Number); const d = new Date(Date.UTC(y!, mo! - 1 + by, 1)); return d.toISOString().slice(0, 7); };

// How far through the month we are (0 to 1), so "behind" means behind pace
function elapsed(m: string) {
  const now = thisMonth();
  if (m < now) return 1;
  if (m > now) return 0;
  const [y, mo] = m.split("-").map(Number);
  const start = Date.UTC(y!, mo! - 1, 1) - 3 * 3600_000, end = Date.UTC(y!, mo!, 1) - 3 * 3600_000;
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}
const pctOf = (a: number, t: number) => (t > 0 ? (a / t) * 100 : null);
function statusOf(r: TargetRow, pace: number) {
  if (!r.hasTarget) return "none" as const;
  const p = pctOf(r.actual.revenue, r.target.revenue) ?? pctOf(r.actual.orders, r.target.orders) ?? pctOf(r.actual.volume, r.target.volume) ?? pctOf(r.actual.newOutlets, r.target.newOutlets);
  if (p === null) return "none" as const;
  if (p >= 100) return "achieved" as const;
  return p >= pace * 100 * 0.9 ? ("on-track" as const) : ("behind" as const);
}
const STATUS = {
  achieved: { label: "Achieved", cls: "bg-emerald-500/10 text-emerald-600" },
  "on-track": { label: "On track", cls: "bg-sky-500/10 text-sky-600" },
  behind: { label: "Behind", cls: "bg-amber-500/10 text-amber-600" },
  none: { label: "No target", cls: "bg-muted text-muted-foreground" },
};

function Progress({ actual, target, fmt }: { actual: number; target: number; fmt: (v: number) => string }) {
  if (target <= 0) return <span className="text-muted-foreground">{fmt(actual)} <span className="text-xs">/ —</span></span>;
  const p = (actual / target) * 100;
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex justify-between text-xs"><span>{fmt(actual)} / {fmt(target)}</span><span className="font-medium">{Math.round(p)}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", p >= 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min(100, p)}%` }} /></div>
    </div>
  );
}

export function TargetsPage() {
  const [level, setLevel] = useState<TargetLevel>("REGION");
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState<TargetsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TargetRow | null>(null);

  const load = useCallback(async () => {
    setData(null);
    try { setData(await targetsService.get(level, month)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load targets"); }
  }, [level, month]);
  useEffect(() => { load(); }, [load]);

  const pace = elapsed(month);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((r) => !q || r.name.toLowerCase().includes(q) || r.parent?.toLowerCase().includes(q));
  }, [data, search]);

  const withTarget = (data?.rows ?? []).filter((r) => r.hasTarget);
  const tRev = withTarget.reduce((s, r) => s + r.target.revenue, 0), aRev = withTarget.reduce((s, r) => s + r.actual.revenue, 0);
  const counts = { achieved: 0, "on-track": 0, behind: 0, none: 0 };
  (data?.rows ?? []).forEach((r) => { counts[statusOf(r, pace)]++; });
  const kpis: { label: string; value: string; Icon: LucideIcon; tone: string }[] = data ? [
    { label: "Revenue target", value: kes(tRev), Icon: TargetIcon, tone: "bg-primary/10 text-primary" },
    { label: "Revenue achieved", value: kes(aRev), Icon: TrendingUp, tone: "bg-sky-500/10 text-sky-600" },
    { label: "Overall achievement", value: tRev ? `${Math.round((aRev / tRev) * 100)}%` : "—", Icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Achieved / On track", value: String(counts.achieved + counts["on-track"]), Icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Behind", value: String(counts.behind), Icon: AlertTriangle, tone: "bg-amber-500/10 text-amber-600" },
    { label: "No target set", value: String(counts.none), Icon: CircleSlash, tone: "bg-muted text-muted-foreground" },
  ] : [];
  const chart = [...withTarget].sort((a, b) => b.target.revenue - a.target.revenue).slice(0, 10).map((r) => ({ name: r.name, Target: r.target.revenue, Actual: r.actual.revenue }));

  const copy = async () => {
    const from = shiftMonth(month, -1);
    try {
      const r = await targetsService.copy(level, from, month);
      toast.success(r.copied ? `Copied ${r.copied} target(s) from ${from}` : "Nothing to copy. Last month has no targets, or they're already set.");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not copy targets"); }
  };
  const noun = LEVELS.find((l) => l.key === level)!.noun;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1"><DashboardHeader title="Targets" description="Set monthly goals for regions, territories and agents, and track achievement" /></div>
            <div className="flex flex-wrap items-center gap-2 sm:mt-1">
              <Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" className="w-40" />
              <Button variant="outline" onClick={copy}><Copy className="mr-2 h-4 w-4" />Copy from last month</Button>
            </div>
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <div className="inline-flex gap-1 rounded-lg border bg-muted/40 p-1">
            {LEVELS.map((l) => <Button key={l.key} size="sm" variant={l.key === level ? "default" : "ghost"} className="h-8 px-4" onClick={() => { setLevel(l.key); setSearch(""); }}>{l.label}</Button>)}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {data ? kpis.map(({ label, value, Icon, tone }) => (
              <Card key={label}><CardContent className="flex items-center gap-3 p-4">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tone)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><div className="truncate text-xl font-semibold leading-tight">{value}</div><div className="truncate text-xs text-muted-foreground">{label}</div></div>
              </CardContent></Card>
            )) : Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-6 w-14 animate-pulse rounded bg-muted" /><div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" /></CardContent></Card>)}
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Revenue: target vs actual</CardTitle><CardDescription>Top 10 {LEVELS.find((l) => l.key === level)!.label.toLowerCase()} by target</CardDescription></CardHeader>
            <CardContent className="h-64">
              {chart.length ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} fontSize={11} />
                  <YAxis width={44} tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip formatter={(v) => [`KES ${num(Number(v))}`]} /><Legend />
                  <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} /><Bar dataKey="Actual" fill="#0f6b4f" radius={[4, 4, 0, 0]} />
                </BarChart></ResponsiveContainer>
              ) : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Set revenue targets to compare them with actual sales.</p>}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="relative sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${LEVELS.find((l) => l.key === level)!.label.toLowerCase()}`} aria-label="Search" className="pl-9" />
            </div>
            <Card className="overflow-hidden"><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>{level === "ASR" ? "Agent" : level === "TERRITORY" ? "Territory" : "Region"}</TableHead>
                {level === "TERRITORY" && <TableHead>Region</TableHead>}
                {METRICS.map((m) => <TableHead key={m.key} className="whitespace-nowrap">{m.label}</TableHead>)}
                <TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const st = STATUS[statusOf(r, pace)];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      {level === "TERRITORY" && <TableCell className="text-muted-foreground">{r.parent}</TableCell>}
                      {METRICS.map((m) => <TableCell key={m.key}><Progress actual={r.actual[m.key]} target={r.target[m.key]} fmt={m.fmt} /></TableCell>)}
                      <TableCell><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>{st.label}</span></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setEditing(r)}><Pencil className="mr-1 h-3.5 w-3.5" />{r.hasTarget ? "Edit" : "Set target"}</Button></TableCell>
                    </TableRow>
                  );
                })}
                {data && rows.length === 0 && <TableRow><TableCell colSpan={level === "TERRITORY" ? 8 : 7} className="py-10 text-center text-muted-foreground">No {noun}s found.</TableCell></TableRow>}
                {!data && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              </TableBody>
            </Table></div></Card>
          </div>
        </div>

        <TargetDialog row={editing} level={level} month={month} onClose={() => setEditing(null)} onSaved={load} />
      </PageContainer>
    </AppShell>
  );
}

function TargetDialog({ row, level, month, onClose, onSaved }: { row: TargetRow | null; level: TargetLevel; month: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ revenue: "", volume: "", orders: "", newOutlets: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (row) setF({ revenue: String(row.target.revenue || ""), volume: String(row.target.volume || ""), orders: String(row.target.orders || ""), newOutlets: String(row.target.newOutlets || "") });
  }, [row]);

  const save = async () => {
    if (!row) return;
    const v = { revenue: Number(f.revenue || 0), volume: Number(f.volume || 0), orders: Number(f.orders || 0), newOutlets: Number(f.newOutlets || 0) };
    if (Object.values(v).some((x) => Number.isNaN(x) || x < 0)) return toast.error("Targets must be zero or more.");
    setBusy(true);
    try { await targetsService.set(level, month, row.id, v); toast.success("Target saved"); onClose(); onSaved(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save target"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Targets for {row?.name}</DialogTitle><DialogDescription>Goals for {month}. Leave a field empty or 0 if it doesn't apply.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {METRICS.map((m) => (
            <div key={m.key} className="space-y-1"><Label>{m.label}</Label>
              <Input type="number" min="0" step={m.key === "orders" || m.key === "newOutlets" ? "1" : "any"} value={f[m.key]} onChange={(e) => setF({ ...f, [m.key]: e.target.value })} /></div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>Save target</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}