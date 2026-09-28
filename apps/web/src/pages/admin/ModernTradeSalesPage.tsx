import { BarChart3, Gauge, Store, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Sales contribution",
          items: [
            "Modern trade remains a major contributor to overall value and channel growth.",
            "The high-volume outlets are increasing share of wallet through improved assortment and visibility.",
            "The next step is to deepen the premium product mix in top-performing stores.",
          ],
        },
        {
          title: "Commercial focus",
          items: [
            "Premium categories remain the strongest growth lever in retail channels.",
            "The highest-performing stores are delivering stronger category breadth and conversion.",
            "Maintaining visibility and product mix remains the key lever for future growth.",
          ],
        },
      ]}
      nextActions={[
        "Review the highest-volume MT accounts.",
        "Improve premium category mix in the key outlets.",
        "Track share-of-wallet change by store cluster.",
        "Prepare the next MT sales review.",
      ]}
    />
  );
}
