import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Activity, CalendarDays, Users, ScrollText, Search, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditLogService, type AuditFilters, type AuditPage, type AuditRow } from "@/services/auditLog.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

const ALL = "all";
const blank: AuditFilters = { search: "", action: "", resourceType: "", from: "", to: "", page: 1 };
const label = (a: string) => a.toLowerCase().split("_").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
const tone = (a: string) =>
  /DELETE|DEACTIVAT|REVOK|SUSPEND/.test(a) ? "bg-red-500/10 text-red-600"
  : /IMPERSONAT|PASSWORD|ROLE/.test(a) ? "bg-amber-500/10 text-amber-600"
  : /CREATE|ACTIVAT|ADDED/.test(a) ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600";

export function AuditLogPage() {
  const [f, setF] = useState<AuditFilters>(blank);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AuditPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    try { setData(await auditLogService.list(f)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load the audit log"); }
  }, [f]);
  useEffect(() => { load(); }, [load]);

  // Wait for typing to pause before searching
  useEffect(() => { const t = setTimeout(() => setF((p) => ({ ...p, search, page: 1 })), 350); return () => clearTimeout(t); }, [search]);

  const set = (patch: Partial<AuditFilters>) => setF((p) => ({ ...p, ...patch, page: 1 }));
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const kpis: { label: string; value: number; Icon: LucideIcon; tone: string }[] = data ? [
    { label: "Events today", value: data.stats.today, Icon: Activity, tone: "bg-primary/10 text-primary" },
    { label: "Events · 7d", value: data.stats.week, Icon: CalendarDays, tone: "bg-sky-500/10 text-sky-600" },
    { label: "Active actors · 7d", value: data.stats.actors, Icon: Users, tone: "bg-violet-500/10 text-violet-600" },
    { label: "Matching filters", value: data.total, Icon: ScrollText, tone: "bg-amber-500/10 text-amber-600" },
  ] : [];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title="Audit Log" description="A record of sensitive actions: who did what, and when" />
          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map(({ label: l, value, Icon, tone: t }) => (
              <Card key={l}><CardContent className="flex items-center gap-3 p-4">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", t)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div><div className="text-xl font-semibold leading-tight">{value.toLocaleString("en-KE")}</div><div className="text-xs text-muted-foreground">{l}</div></div>
              </CardContent></Card>
            ))}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by actor, action or resource ID" aria-label="Search" className="pl-9" />
            </div>
            <Select value={f.action || ALL} onValueChange={(v) => set({ action: !v || v === ALL ? "" : v })}>
              <SelectTrigger className="lg:w-52" aria-label="Action"><SelectValue>{f.action ? label(f.action) : "All Actions"}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All Actions</SelectItem>{data?.actions.map((a) => <SelectItem key={a} value={a}>{label(a)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={f.resourceType || ALL} onValueChange={(v) => set({ resourceType: !v || v === ALL ? "" : v })}>
              <SelectTrigger className="lg:w-40" aria-label="Resource"><SelectValue>{f.resourceType ? label(f.resourceType) : "All Resources"}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All Resources</SelectItem>{data?.resourceTypes.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} aria-label="From date" className="lg:w-40" />
            <Input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} aria-label="To date" className="lg:w-40" />
            <Button variant="outline" onClick={() => { setSearch(""); setF(blank); }}>Reset</Button>
          </div>

          <Card className="overflow-hidden"><div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>{["Time", "Actor", "Action", "Resource", "Details"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {data?.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(r.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                  <TableCell className="font-medium">{r.actor}</TableCell>
                  <TableCell><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tone(r.action))}>{label(r.action)}</span></TableCell>
                  <TableCell>{r.resourceType ? <><Badge variant="outline">{r.resourceType}</Badge> <span className="font-mono text-xs text-muted-foreground">{r.resourceId?.slice(0, 8)}</span></> : "—"}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setOpen(r)}>View</Button></TableCell>
                </TableRow>
              ))}
              {data && data.rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No events match your filters.</TableCell></TableRow>}
              {!data && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
            </TableBody>
          </Table></div></Card>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {f.page} of {pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
              <Button size="sm" variant="outline" disabled={f.page >= pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{open && label(open.action)}</DialogTitle>
              <DialogDescription>{open && `${open.actor} · ${new Date(open.createdAt).toLocaleString()}`}</DialogDescription></DialogHeader>
            {open && (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Resource:</span> {open.resourceType ?? "—"} <span className="font-mono text-xs">{open.resourceId}</span></p>
                <p><span className="text-muted-foreground">Request ID:</span> <span className="font-mono text-xs">{open.requestId ?? "—"}</span></p>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{open.metadata ? JSON.stringify(open.metadata, null, 2) : "No extra details."}</pre>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppShell>
  );
}