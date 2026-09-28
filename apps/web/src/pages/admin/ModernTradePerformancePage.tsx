import { BarChart3, Gauge, Store, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Performance overview",
          items: [
            "Modern trade continues to outperform in premium locations and seasonal demand pockets.",
            "The strongest growth area is in high-volume urban stores and must-win accounts.",
            "Coverage remains strong, but better activation is still needed in some secondary trade zones.",
          ],
        },
        {
          title: "Commercial priorities",
          items: [
            "Urban premium retailers remain the strongest revenue drivers.",
            "Secondary trade zones need more targeted activation and visibility support.",
            "Channel uplift will improve if premium categories are more consistently stocked.",
          ],
        },
      ]}
      nextActions={[
        "Review underperforming retail zones.",
        "Increase activation support in secondary trade clusters.",
        "Improve premium category visibility in high-volume stores.",
        "Prepare the next MT performance summary.",
      ]}
    />
  );
}
