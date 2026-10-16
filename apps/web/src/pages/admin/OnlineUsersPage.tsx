import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, roleLabel } from "@/lib/api"; // use your existing API helper; see the note below
import { SignalBars } from "@/components/onlineusers/SignalBars";
import { UserActions, type OnlineUser } from "@/components/onlineusers/UserActions";

const PERIODS = ["LIVE", "1H", "3H", "6H", "1D", "1W", "2W", "1M", "3M", "6M", "1Y", "YTD"];

type Kpis = {
  total: number; registered: number; online: number; active: number; never: number; newUsers: number;
  mostActiveToday: { name: string; logins: number } | null;
};
type Overview = { kpis: Kpis; users: OnlineUser[] };

const fetchOnline = async (period: string) =>
  (await api(`/dashboard/online-users?period=${period}`)).data as Overview;

export default function OnlineUsers() {
  const [period, setPeriod] = useState("LIVE");
  const [target, setTarget] = useState<OnlineUser | null>(null);
  const [series, setSeries] = useState<{ t: number; n: number }[]>([]);

  const main = useQuery({
    queryKey: ["online-users", period],
    queryFn: () => fetchOnline(period),
    refetchInterval: period === "LIVE" ? 5000 : false,
  });

  // Separate 1-second poll just for the live graph (last 30 points)
  const pulse = useQuery({
    queryKey: ["online-users-pulse"],
    queryFn: () => fetchOnline("LIVE"),
    refetchInterval: 1000,
    select: (d) => d.kpis.online,
  });
  useEffect(() => {
    if (pulse.data !== undefined) setSeries((s) => [...s, { t: Date.now(), n: pulse.data! }].slice(-30));
  }, [pulse.dataUpdatedAt]);

  const k = main.data?.kpis;
  const cards: [string, React.ReactNode][] = k
    ? [
        ["Total users", k.total],
        ["Registered", k.registered],
        ["Online now", (
          <span className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />{k.online}
          </span>
        )],
        ["Active users", k.active],
        ["Never logged in", k.never],
        ["Most active today", k.mostActiveToday ? `${k.mostActiveToday.name} · ${k.mostActiveToday.logins}` : "—"],
        [`New users (${period})`, k.newUsers],
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Online Users</h1>
          <p className="text-sm text-muted-foreground">
            See who is signed in right now, how active they are, and step in to manage or support any account.
          </p>
        </div>
        <Button variant="outline" className="ml-auto" onClick={() => main.refetch()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${main.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <Button key={p} size="sm" variant={p === period ? "default" : "outline"} onClick={() => setPeriod(p)}>
            {p}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live graph</CardTitle>
          <CardDescription>Users online, last 30 seconds</CardDescription>
        </CardHeader>
        <CardContent className="h-40">
          <ResponsiveContainer>
            <LineChart data={series}>
              <XAxis dataKey="t" hide />
              <YAxis allowDecimals={false} width={28} />
              <Tooltip labelFormatter={() => ""} />
              <Line dataKey="n" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <h2 className="pt-2 text-lg font-semibold">Online users snapshot</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Email", "Role", "Department", "Last seen", "Online", "Action"].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {main.data?.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.displayName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role ? roleLabel(u.role) : "—"}</TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell>
                  {u.isOnline ? <Badge>Online</Badge> : u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : "Never"}
                </TableCell>
                <TableCell><SignalBars online={u.isOnline} /></TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setTarget(u)}>Actions</Button>
                </TableCell>
              </TableRow>
            ))}
            {main.data?.users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Nobody in this period. Try a longer one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <UserActions user={target} open={!!target} onClose={() => setTarget(null)} />
    </div>
  );
}