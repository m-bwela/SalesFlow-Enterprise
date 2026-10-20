import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userManagementService, type OnlineOverview, type OnlineUser } from "@/services/userManagement.service";
import { SignalBars } from "@/components/onlineusers/SignalBars";
import { UserActions, roleLabel } from "@/components/onlineusers/UserActions";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";

const PERIODS = ["LIVE", "1H", "3H", "6H", "1D", "1W", "2W", "1M", "3M", "6M", "1Y", "YTD"];
const POLL_MS = 3000; // 10 points x 3s = the last 30 seconds

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;
  return `${Math.floor(mins / 1440)} d ago`;
}

export function OnlineUsersPage() {
  const [period, setPeriod] = useState("LIVE");
  const [live, setLive] = useState<OnlineOverview | null>(null);
  const [history, setHistory] = useState<OnlineOverview | null>(null);
  const [series, setSeries] = useState<{ n: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [target, setTarget] = useState<OnlineUser | null>(null);

  const loadLive = useCallback(async () => {
    try {
      const d = await userManagementService.getOnlineUsers("LIVE");
      setLive(d);
      setSeries((s) => [...s, { n: d.kpis.online }].slice(-10));
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load online users");
    }
  }, []);

  const loadPeriod = useCallback(async () => {
    if (period === "LIVE") return;
    setLoading(true);
    try {
      setHistory(await userManagementService.getOnlineUsers(period));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load online users");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadLive();
    const id = setInterval(loadLive, POLL_MS);
    return () => clearInterval(id);
  }, [loadLive]);

  useEffect(() => { loadPeriod(); }, [loadPeriod]);

  const refresh = async () => {
    setLoading(true);
    await Promise.all([loadLive(), loadPeriod()]);
    setLoading(false);
  };

  const data = period === "LIVE" ? live : history;
  const k = data?.kpis;
  const cards: { label: string; value: React.ReactNode; highlight?: boolean }[] = k
    ? [
        { label: "Total users", value: k.total },
        { label: "Registered", value: k.registered },
        {
          label: "Online now",
          highlight: true,
          value: (
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
              {live?.kpis.online ?? k.online}
            </span>
          ),
        },
        { label: "Active users", value: k.active },
        { label: "Never logged in", value: k.never },
        {
          label: "Most active today",
          value: k.mostActiveToday ? (
            <span className="block truncate text-base">
              {k.mostActiveToday.name} <span className="text-muted-foreground">· {k.mostActiveToday.logins}</span>
            </span>
          ) : "—",
        },
        { label: `New users (${period})`, value: k.newUsers },
      ]
    : [];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          {/* Header + refresh */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <DashboardHeader
                title="Online Users"
                description="See who is signed in right now, how active they are, and step in to manage or support any account."
              />
            </div>
            <div className="flex items-center gap-3 sm:pt-1">
              {updatedAt && (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Period filters */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="inline-flex gap-1 rounded-lg border bg-muted/40 p-1">
              {PERIODS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === period ? "default" : "ghost"}
                  className="h-8 px-3"
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {k
              ? cards.map(({ label, value, highlight }) => (
                  <Card key={label} className={cn(highlight && "border-emerald-500/40 bg-emerald-500/5")}>
                    <CardContent className="p-4">
                      <div className="min-w-0 text-2xl font-semibold leading-tight">{value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                ))
              : Array.from({ length: 7 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Live graph */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live graph</CardTitle>
              <CardDescription>Users online, last 30 seconds</CardDescription>
            </CardHeader>
            <CardContent className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis hide />
                  <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={() => ""} formatter={(v) => [v, "Online"]} />
                  <Line dataKey="n" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Snapshot table */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Online users snapshot</h2>
              {data && <span className="text-sm text-muted-foreground">{data.users.length} shown</span>}
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden lg:table-cell">Department</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead>Online</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials(u.displayName)}
                            </span>
                            <span className="font-medium">{u.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{u.email}</TableCell>
                        <TableCell>
                          {u.role ? <Badge variant="secondary">{roleLabel(u.role)}</Badge> : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{u.department}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {u.isOnline ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Online</Badge> : timeAgo(u.lastSeenAt)}
                        </TableCell>
                        <TableCell><SignalBars online={u.isOnline} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setTarget(u)}>Actions</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data && data.users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          Nobody in this period. Try a longer one.
                        </TableCell>
                      </TableRow>
                    )}
                    {!data && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>

        <UserActions user={target} open={!!target} onClose={() => setTarget(null)} onChanged={refresh} />
      </PageContainer>
    </AppShell>
  );
}