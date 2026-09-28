import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileText,
  Gauge,
  MapPinned,
  Package,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

interface Metric {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

interface AdminOverviewPageProps {
  title: string;
  description: string;
  metrics: Metric[];
  highlights: string[];
}

function AdminOverviewPage({ title, description, metrics, highlights }: AdminOverviewPageProps) {
  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader title={title} description={description} />

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

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Operational snapshot</h2>
              <div className="space-y-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Next actions</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Confirm the latest sales and coverage data sync.</li>
                <li>• Review route performance and approval queue.</li>
                <li>• Validate user access and role assignments.</li>
                <li>• Review stock and asset levels before the next cycle.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}

export function SalesDashboardPage() {
  return (
    <AdminOverviewPage
      title="Sales Dashboard"
      description="Track daily and monthly sales performance across the business."
      metrics={[
        { title: "Gross sales", value: "KES 16.8M", description: "This month", icon: TrendingUp },
        { title: "Orders", value: "2,184", description: "Completed orders", icon: BarChart3 },
        { title: "Active outlets", value: "486", description: "Outlet coverage", icon: Store },
        { title: "Avg basket", value: "KES 7,680", description: "Per order", icon: Gauge },
      ]}
      highlights={[
        "The Coast region is leading in volume this week, driven by strong distributor replenishment.",
        "Modern trade sales are recovering after the previous week’s stock delay.",
        "Customer retention remains stable with an increase in repeat visits in Nairobi.",
      ]}
    />
  );
}

export function PerformancePage() {
  return (
    <AdminOverviewPage
      title="Performance"
      description="Monitor target attainment and team execution by region and segment."
      metrics={[
        { title: "Target attainment", value: "92%", description: "Overall achievement", icon: Gauge },
        { title: "Top region", value: "Coast", description: "Highest momentum", icon: MapPinned },
        { title: "Active reps", value: "138", description: "Field coverage", icon: Users },
        { title: "Route completion", value: "86%", description: "Completed routes", icon: Activity },
      ]}
      highlights={[
        "Regional teams hit the highest score in the last 7-day cycle for order conversion.",
        "Route completion remains strongest in urban territories with minimal disruptions.",
        "Focus remains on reducing missed calls and replenishment delays in the West.",
      ]}
    />
  );
}

export function AnalyticsPage() {
  return (
    <AdminOverviewPage
      title="Analytics"
      description="Inspect trends, coverage, and product performance across channels."
      metrics={[
        { title: "Value growth", value: "+12.4%", description: "Month-over-month", icon: TrendingUp },
        { title: "Channel mix", value: "52/48", description: "General / modern trade", icon: BarChart3 },
        { title: "Top SKU", value: "SKU-2041", description: "Fastest mover", icon: Package },
        { title: "Return rate", value: "1.9%", description: "Compared to target", icon: FileText },
      ]}
      highlights={[
        "Fast-moving products remain concentrated in the top three territories for volume growth.",
        "Modern trade continues to lift average order size while general trade remains the volume leader.",
        "Stock-out risk is low, but attention is needed on the Central region replenishment cycle.",
      ]}
    />
  );
}

export function ReportsPage() {
  return (
    <AdminOverviewPage
      title="Reports"
      description="Pull summaries for sales, operations, inventory, and organizational performance."
      metrics={[
        { title: "Monthly reports", value: "18", description: "Generated this cycle", icon: FileText },
        { title: "Pending exports", value: "3", description: "Waiting for review", icon: ClipboardCheck },
        { title: "Audit checks", value: "100%", description: "Completed", icon: ShieldCheck },
        { title: "Last sync", value: "09:15 AM", description: "System update", icon: Activity },
      ]}
      highlights={[
        "The monthly operations summary has been generated and queued for distribution.",
        "Regional managers can review performance by territory, distributor, and month.",
        "Audit logs are clean and the reporting pipeline remains synchronized with source data.",
      ]}
    />
  );
}

export function ASRDashboardPage() {
  return (
    <AdminOverviewPage
      title="ASR Dashboard"
      description="Track ASR execution, call activity, and account coverage."
      metrics={[
        { title: "Active ASRs", value: "74", description: "Current team", icon: Users },
        { title: "Visit rate", value: "89%", description: "Planned visits complete", icon: Activity },
        { title: "Submitted orders", value: "641", description: "This week", icon: TrendingUp },
        { title: "Accounts covered", value: "318", description: "Unique outlets", icon: Store },
      ]}
      highlights={[
        "ASR completion rate is highest in high-volume urban clusters and lower in remote route coverage.",
        "Field visits remain aligned to account priority and coverage targets.",
        "Follow-up actions are needed for a small set of delayed outlet visits.",
      ]}
    />
  );
}

export function RoutesPage() {
  return (
    <AdminOverviewPage
      title="Routes"
      description="Manage route plans, daily execution, and regional movement coverage."
      metrics={[
        { title: "Open routes", value: "42", description: "Pending execution", icon: MapPinned },
        { title: "Completed", value: "318", description: "This week", icon: Activity },
        { title: "Coverage", value: "91%", description: "Planned coverage", icon: Gauge },
        { title: "Avg route time", value: "4.7h", description: "Per day", icon: Activity },
      ]}
      highlights={[
        "Route execution remains steady with improved clustering around key distributor hubs.",
        "A few remote routes still require rescheduling to optimize daily coverage.",
        "The route planning team is aligning today’s coverage with stock availability and visit priority.",
      ]}
    />
  );
}

export function RouteActivityPage() {
  return (
    <AdminOverviewPage
      title="Route Activity"
      description="Review field movement, time spent, and visit completion by route."
      metrics={[
        { title: "Visits today", value: "267", description: "Recorded activities", icon: Activity },
        { title: "On-time", value: "91%", description: "Visit completion", icon: Gauge },
        { title: "Delayed stops", value: "18", description: "Needs follow-up", icon: ClipboardCheck },
        { title: "Distance covered", value: "1,860 km", description: "Today", icon: MapPinned },
      ]}
      highlights={[
        "The route distribution team maintained a strong on-time rate for the morning cycle.",
        "Traffic and road conditions caused a few delays in the South corridor.",
        "Review is recommended for the last 3 delayed route clusters.",
      ]}
    />
  );
}

export function RouteEffectivenessPage() {
  return (
    <AdminOverviewPage
      title="Route Effectiveness"
      description="Compare route quality, outlet conversion, and rep productivity."
      metrics={[
        { title: "Effectiveness", value: "87%", description: "Average score", icon: Gauge },
        { title: "Conversion", value: "54%", description: "Order conversion", icon: TrendingUp },
        { title: "Avg stop time", value: "17 min", description: "Per outlet", icon: Activity },
        { title: "Best route", value: "NBO-04", description: "Top performance", icon: MapPinned },
      ]}
      highlights={[
        "High-performing routes are driven by better outlet sequencing and predictable follow-up timing.",
        "Conversion remains strongest where route planning aligns with distributor delivery windows.",
        "The underperforming routes need intervention on volume planning and call discipline.",
      ]}
    />
  );
}

export function RoutePlansPage() {
  return (
    <AdminOverviewPage
      title="Route Plans"
      description="Coordinate planned route coverage, workload allocation, and approval stages."
      metrics={[
        { title: "Draft plans", value: "12", description: "Pending review", icon: ClipboardCheck },
        { title: "Approved", value: "96", description: "Current cycle", icon: ShieldCheck },
        { title: "Regions", value: "6", description: "Planned coverage", icon: MapPinned },
        { title: "Load balance", value: "83%", description: "Even distribution", icon: BarChart3 },
      ]}
      highlights={[
        "The route approval queue is almost fully cleared for the upcoming cycle.",
        "Most plans are balanced across teams, with only minor adjustments still needed in the West.",
        "A few routes are waiting on the latest stock confirmation before final approval.",
      ]}
    />
  );
}

export function OutletsPage() {
  return (
    <AdminOverviewPage
      title="Outlets"
      description="Manage customer outlets, trading status, and coverage by distribution territory."
      metrics={[
        { title: "Total outlets", value: "2,460", description: "Registered customers", icon: Store },
        { title: "Active", value: "2,114", description: "Trading accounts", icon: Activity },
        { title: "New this month", value: "86", description: "Added accounts", icon: TrendingUp },
        { title: "Inactive", value: "346", description: "Needs review", icon: Gauge },
      ]}
      highlights={[
        "Coverage continues to expand in the Coast and Nairobi territories.",
        "Inactive outlets are being reviewed to determine whether they require reactivation or removal.",
        "Outlet quality scoring remains strongest in the top-performing urban districts.",
      ]}
    />
  );
}

export function WarehousesPage() {
  return (
    <AdminOverviewPage
      title="Warehouses"
      description="Monitor stock hubs, inventory flow, and distribution points."
      metrics={[
        { title: "Warehouses", value: "23", description: "Operational hubs", icon: Warehouse },
        { title: "Utilization", value: "78%", description: "Average stock use", icon: Gauge },
        { title: "Ready to dispatch", value: "91%", description: "In-stock availability", icon: Package },
        { title: "Pending transfers", value: "14", description: "In transit", icon: Activity },
      ]}
      highlights={[
        "Warehouse utilization remains stable and within target thresholds.",
        "Most dispatch delays are caused by last-mile transfer planning and stock balancing.",
        "The operations team is prioritizing a few high-volume transfer requests before the next cycle.",
      ]}
    />
  );
}

export function OrganizationStructurePage() {
  return (
    <AdminOverviewPage
      title="Organization Structure"
      description="Review the hierarchy of regions, territories, and business ownership."
      metrics={[
        { title: "Regions", value: "6", description: "Operational regions", icon: MapPinned },
        { title: "Territories", value: "24", description: "Assigned coverage areas", icon: Activity },
        { title: "Distributors", value: "82", description: "Active partners", icon: Store },
        { title: "Managers", value: "34", description: "Field leadership", icon: Users },
      ]}
      highlights={[
        "The structure remains aligned to the current regional sales model and territory ownership.",
        "Leadership roles are mapped to clear ownership zones across field and distributor operations.",
        "The next review will focus on balance between territorial demand and manager coverage.",
      ]}
    />
  );
}

export function ASRManagementPage() {
  return (
    <AdminOverviewPage
      title="ASR Management"
      description="Supervise ASR assignment, accountability, and field performance."
      metrics={[
        { title: "Assigned ASRs", value: "74", description: "Current roster", icon: Users },
        { title: "Open tasks", value: "9", description: "Pending follow-up", icon: ClipboardCheck },
        { title: "Performance", value: "89%", description: "Average score", icon: Gauge },
        { title: "Account coverage", value: "318", description: "Managed outlets", icon: Store },
      ]}
      highlights={[
        "ASR management remains active with close attention to outreach and account coverage.",
        "A few field representatives require coaching on route discipline and dispatch timing.",
        "Standardized weekly review helps maintain accountability and target delivery.",
      ]}
    />
  );
}

export function OnlineUsersPage() {
  return (
    <AdminOverviewPage
      title="Online Users"
      description="Monitor active platform usage and system engagement."
      metrics={[
        { title: "Online now", value: "143", description: "Connected users", icon: Users },
        { title: "Last 5 min", value: "96", description: "Active sessions", icon: Activity },
        { title: "Regions active", value: "5", description: "Currently online", icon: MapPinned },
        { title: "Avg session", value: "18 min", description: "Current usage", icon: Gauge },
      ]}
      highlights={[
        "Platform engagement remains consistent across the reporting and field operations teams.",
        "Most active users are concentrated in sales, field management, and operations support.",
        "Monitoring continues to prioritize session health and role-based access checks.",
      ]}
    />
  );
}

export function UserActivityPage() {
  return (
    <AdminOverviewPage
      title="User Activity"
      description="Review system access, actions, and accountability across the platform."
      metrics={[
        { title: "Logins today", value: "1,280", description: "Successful sessions", icon: Activity },
        { title: "Failed attempts", value: "12", description: "Needs review", icon: ShieldCheck },
        { title: "Top role", value: "ASR", description: "Most active role", icon: Users },
        { title: "Timeouts", value: "4", description: "Potential issues", icon: Gauge },
      ]}
      highlights={[
        "User activity remains strong with predictable login and session behavior.",
        "Security checks are monitoring a limited set of failed attempts and unusual access patterns.",
        "The operations team will review the few timeout reports for potential device or connectivity issues.",
      ]}
    />
  );
}

export function UserImpersonationPage() {
  return (
    <AdminOverviewPage
      title="Impersonation"
      description="Manage privileged session switching and administrative access review."
      metrics={[
        { title: "Current sessions", value: "3", description: "Active impersonations", icon: Users },
        { title: "Authorized", value: "11", description: "Configured users", icon: ShieldCheck },
        { title: "Recent actions", value: "24", description: "In last 24 hrs", icon: Activity },
        { title: "Audit score", value: "100%", description: "Review compliance", icon: Gauge },
      ]}
      highlights={[
        "Privileged sessions are fully audited and limited to approved admin use cases.",
        "The current impersonation list remains small and controlled by role-based access.",
        "No concerns were raised from the latest review of impersonation activity.",
      ]}
    />
  );
}

export function ProductsPage() {
  return (
    <AdminOverviewPage
      title="Products"
      description="Manage the product catalog and commercial assortment."
      metrics={[
        { title: "Products", value: "1,240", description: "Active catalog items", icon: Package },
        { title: "New this month", value: "26", description: "Added SKUs", icon: TrendingUp },
        { title: "Top category", value: "Beverages", description: "Demand leader", icon: BarChart3 },
        { title: "Stock risk", value: "4", description: "Items flagged", icon: Gauge },
      ]}
      highlights={[
        "The catalog remains active and aligned to current commercial priorities.",
        "A handful of SKUs need re-review due to reduced movement or stock risk.",
        "The next cycle will focus on better category balancing and pricing alignment.",
      ]}
    />
  );
}

export function AssetsPage() {
  return (
    <AdminOverviewPage
      title="Assets"
      description="Track business assets, equipment, and operational resources."
      metrics={[
        { title: "Assets", value: "684", description: "Registered assets", icon: Package },
        { title: "Operational", value: "634", description: "Available", icon: Activity },
        { title: "Maintenance", value: "11", description: "Due soon", icon: ClipboardCheck },
        { title: "Risk items", value: "8", description: "Needs attention", icon: Gauge },
      ]}
      highlights={[
        "Asset coverage remains healthy across core operational regions.",
        "A few maintenance records need follow-up before the next planning cycle.",
        "Asset tracking continues to support service reliability and distribution readiness.",
      ]}
    />
  );
}

export function AssetInventoryPage() {
  return (
    <AdminOverviewPage
      title="Asset Inventory"
      description="Review equipment assignments and stock visibility across the network."
      metrics={[
        { title: "Units tracked", value: "684", description: "Total tracked", icon: Package },
        { title: "Assigned", value: "436", description: "Currently in use", icon: Activity },
        { title: "Available", value: "182", description: "Ready to deploy", icon: Warehouse },
        { title: "At risk", value: "9", description: "Needs follow-up", icon: Gauge },
      ]}
      highlights={[
        "The network has enough inventory for most field operations without acute shortages.",
        "A small group of items is due for review based on usage and service history.",
        "Inventory monitoring remains aligned to route and logistics planning requirements.",
      ]}
    />
  );
}

export function InventoryPage() {
  return (
    <AdminOverviewPage
      title="Inventory"
      description="Monitor stock availability and movement across sales channels and warehouses."
      metrics={[
        { title: "Available stock", value: "92%", description: "Current fill rate", icon: Warehouse },
        { title: "Reorder queue", value: "16", description: "Products flagged", icon: ClipboardCheck },
        { title: "Fast movers", value: "39", description: "High velocity items", icon: Package },
        { title: "Transfers", value: "14", description: "Pending moves", icon: Activity },
      ]}
      highlights={[
        "Inventory coverage is stable across the network with most high-demand SKUs available.",
        "A few categories require better replenishment visibility to prevent stock-out risk.",
        "Operations is aligning transfer priorities to the highest-velocity product lines.",
      ]}
    />
  );
}

export function ModernTradePerformancePage() {
  return (
    <AdminOverviewPage
      title="MT Performance"
      description="Track modern trade execution and performance across premium retailer channels."
      metrics={[
        { title: "Sales", value: "KES 5.6M", description: "Modern trade sales", icon: TrendingUp },
        { title: "Retailers", value: "134", description: "Active accounts", icon: Store },
        { title: "Coverage", value: "93%", description: "Target coverage", icon: Gauge },
        { title: "Upsell", value: "+9.1%", description: "Channel lift", icon: BarChart3 },
      ]}
      highlights={[
        "Modern trade continues to outperform in premium locations and seasonal demand pockets.",
        "The strongest growth area is in high-volume urban stores and must-win accounts.",
        "Coverage remains strong, but better activation is still needed in some secondary trade zones.",
      ]}
    />
  );
}

export function ModernTradeTSMPage() {
  return (
    <AdminOverviewPage
      title="MT TSM Dashboard"
      description="Review the modern trade team’s execution, call rhythm, and gap closure."
      metrics={[
        { title: "Active TSMs", value: "12", description: "Current team", icon: Users },
        { title: "Visits", value: "214", description: "This week", icon: Activity },
        { title: "Follow-up", value: "31", description: "Pending actions", icon: ClipboardCheck },
        { title: "Coverage", value: "94%", description: "Account coverage", icon: Gauge },
      ]}
      highlights={[
        "Modern trade TSM activity remains strong and aligned to key retail programs.",
        "The team is focusing on follow-up planning to close gaps in low-coverage stores.",
        "Operational quality remains strong across assigned customer clusters.",
      ]}
    />
  );
}

export function ModernTradeOutletsPage() {
  return (
    <AdminOverviewPage
      title="MT Outlets"
      description="Track modern trade outlets and account-level performance."
      metrics={[
        { title: "Outlets", value: "386", description: "Modern trade stores", icon: Store },
        { title: "Active", value: "342", description: "Trading accounts", icon: Activity },
        { title: "Avg order", value: "KES 11,400", description: "Per outlet", icon: TrendingUp },
        { title: "Coverage", value: "91%", description: "Outlet coverage", icon: Gauge },
      ]}
      highlights={[
        "Outlets in major city centres continue to deliver robust sales and better order frequency.",
        "Coverage is improving in secondary retail clusters with new account activation.",
        "The next review will focus on spend quality and category mix by store profile.",
      ]}
    />
  );
}

export function ModernTradeSalesPage() {
  return (
    <AdminOverviewPage
      title="MT Sales"
      description="Review modern trade sales contribution by segment and outlet type."
      metrics={[
        { title: "MT sales", value: "KES 5.6M", description: "Current period", icon: TrendingUp },
        { title: "Contribution", value: "31%", description: "Total portfolio", icon: BarChart3 },
        { title: "Top store", value: "City Mart", description: "Highest volume", icon: Store },
        { title: "Share of wallet", value: "42%", description: "Average mix", icon: Gauge },
      ]}
      highlights={[
        "Modern trade remains a major contributor to overall value and channel growth.",
        "The high-volume outlets are increasing share of wallet through improved assortment and visibility.",
        "The next step is to deepen the premium product mix in top-performing stores.",
      ]}
    />
  );
}

