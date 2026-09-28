import {
  Activity,
  BarChart3,
  Gauge,
  MapPinned,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

const periods = [
  "Today",
  "Yesterday",
  "This week",
  "Last week",
  "This month",
  "All",
];

const tsmRows = [
  {
    tsm: "Grace Wanjiku",
    email: "grace.wanjiku@salesflow.co.ke",
    phone: "+254 712 456 788",
    lastLogin: "08:42 AM",
    region: "Coast",
    territory: "Mombasa",
    rank: "#1",
    distributors: "08",
    asrs: "03",
    revenue: "KES 4.2M",
    processed: "612",
    delayed: "04",
    status: "Healthy",
  },
  {
    tsm: "Daniel Otieno",
    email: "daniel.otieno@salesflow.co.ke",
    phone: "+254 722 880 443",
    lastLogin: "09:14 AM",
    region: "Nairobi",
    territory: "Nairobi Central",
    rank: "#2",
    distributors: "07",
    asrs: "02",
    revenue: "KES 3.9M",
    processed: "548",
    delayed: "06",
    status: "Stable",
  },
  {
    tsm: "Mary Kamau",
    email: "mary.kamau@salesflow.co.ke",
    phone: "+254 734 201 442",
    lastLogin: "10:05 AM",
    region: "Western",
    territory: "Kisumu",
    rank: "#3",
    distributors: "06",
    asrs: "02",
    revenue: "KES 3.5M",
    processed: "482",
    delayed: "08",
    status: "Watch",
  },
  {
    tsm: "Joseph Kariuki",
    email: "joseph.kariuki@salesflow.co.ke",
    phone: "+254 720 112 554",
    lastLogin: "07:56 AM",
    region: "Central",
    territory: "Nyeri",
    rank: "#4",
    distributors: "05",
    asrs: "02",
    revenue: "KES 3.1M",
    processed: "441",
    delayed: "09",
    status: "Stable",
  },
  {
    tsm: "Lucy Achieng",
    email: "lucy.achieng@salesflow.co.ke",
    phone: "+254 711 903 341",
    lastLogin: "08:12 AM",
    region: "Rift Valley",
    territory: "Nakuru",
    rank: "#5",
    distributors: "06",
    asrs: "03",
    revenue: "KES 2.9M",
    processed: "430",
    delayed: "05",
    status: "Healthy",
  },
  {
    tsm: "Peter Njoroge",
    email: "peter.njoroge@salesflow.co.ke",
    phone: "+254 768 304 709",
    lastLogin: "09:32 AM",
    region: "Eastern",
    territory: "Meru",
    rank: "#6",
    distributors: "04",
    asrs: "02",
    revenue: "KES 2.6M",
    processed: "398",
    delayed: "07",
    status: "Watch",
  },
  {
    tsm: "Beatrice Muli",
    email: "beatrice.muli@salesflow.co.ke",
    phone: "+254 790 118 624",
    lastLogin: "08:26 AM",
    region: "North Rift",
    territory: "Eldoret",
    rank: "#7",
    distributors: "05",
    asrs: "02",
    revenue: "KES 2.4M",
    processed: "365",
    delayed: "10",
    status: "Stable",
  },
  {
    tsm: "Paul Maingi",
    email: "paul.maingi@salesflow.co.ke",
    phone: "+254 701 884 910",
    lastLogin: "07:48 AM",
    region: "Coast",
    territory: "Kwale",
    rank: "#8",
    distributors: "04",
    asrs: "02",
    revenue: "KES 2.2M",
    processed: "342",
    delayed: "11",
    status: "Watch",
  },
  {
    tsm: "Esther Nduku",
    email: "esther.nduku@salesflow.co.ke",
    phone: "+254 716 509 882",
    lastLogin: "09:08 AM",
    region: "Nairobi",
    territory: "Westlands",
    rank: "#9",
    distributors: "03",
    asrs: "01",
    revenue: "KES 1.9M",
    processed: "296",
    delayed: "06",
    status: "Healthy",
  },
  {
    tsm: "Samuel Wekesa",
    email: "samuel.wekesa@salesflow.co.ke",
    phone: "+254 758 320 401",
    lastLogin: "08:58 AM",
    region: "Western",
    territory: "Bungoma",
    rank: "#10",
    distributors: "03",
    asrs: "01",
    revenue: "KES 1.7M",
    processed: "274",
    delayed: "12",
    status: "Watch",
  },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "Healthy":
      return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30";
    case "Stable":
      return "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30";
    case "Watch":
      return "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TSMDashboardPage() {
  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="TSM Dashboard"
            description="Territory Leadership overview"
          />

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-15">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    period === "This week"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Region</span>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0">
                  <option>All regions</option>
                  <option>Coast</option>
                  <option>Nairobi</option>
                  <option>Western</option>
                  <option>Central</option>
                  <option>Rift Valley</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Territory</span>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0">
                  <option>All territories</option>
                  <option>Mombasa</option>
                  <option>Nairobi Central</option>
                  <option>Kisumu</option>
                  <option>Nyeri</option>
                  <option>Nakuru</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total TSMs" value="84" description="Across all territories" icon={Users} />
            <KpiCard title="Active TSMs" value="71" description="Currently active" icon={Activity} />
            <KpiCard title="Online Now" value="42" description="Logged in live" icon={Gauge} />
            <KpiCard title="Distributors" value="318" description="Mapped distributors" icon={Store} />
            <KpiCard title="ASRs Attached" value="174" description="Assigned field coverage" icon={MapPinned} />
            <KpiCard title="Revenue" value="KES 34.8M" description="Current period" icon={TrendingUp} />
            <KpiCard title="Orders Processed" value="6,840" description="Completed this cycle" icon={BarChart3} />
            <KpiCard title="Average Score" value="89%" description="Team performance" icon={ShieldCheck} />
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">TSM Snapshot</h2>
              <h3 className="text-sm">Territory leads with distributor and ASR coverage. Click a row for details</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "TSM",
                      "REGION",
                      "TERRITORY",
                      "RANK",
                      "DISTRIBUTORS",
                      "ASRS",
                      "REVENUE",
                      "PROCESSED",
                      "DELAYED",
                      "STATUS",
                    ].map((column) => (
                      <th key={column} className="px-4 py-3 font-medium text-muted-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tsmRows.map((row) => (
                    <tr key={row.tsm} className="border-t align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{row.tsm}</div>
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          <div>{row.email}</div>
                          <div>{row.phone}</div>
                          <div>Last login: {row.lastLogin}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.region}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.territory}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.rank}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.distributors}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.asrs}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.revenue}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.processed}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.delayed}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
