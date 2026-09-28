import { BarChart3, Gauge, Store, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Sales momentum",
          items: [
            "The Coast region is leading in volume this week, driven by strong distributor replenishment.",
            "Modern trade sales are recovering after the previous week’s stock delay.",
            "Customer retention remains stable with an increase in repeat visits in Nairobi.",
          ],
        },
        {
          title: "Channel focus",
          items: [
            "General trade remains the largest volume driver across the weekly cycle.",
            "Modern trade is improving its average order value and conversion quality.",
            "Regional incentives are aligning better with seasonal outlet demand.",
          ],
        },
      ]}
      nextActions={[
        "Confirm the latest sales and coverage data sync.",
        "Review route performance and approval queue.",
        "Validate top-performing outlets for replenishment planning.",
        "Check distributor stock issues before the next cycle.",
      ]}
    />
  );
}
