import { BarChart3, FileText, Package, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Trend watch",
          items: [
            "Fast-moving products remain concentrated in the top three territories for volume growth.",
            "Modern trade continues to lift average order size while general trade remains the volume leader.",
            "Stock-out risk is low, but attention is needed on the Central region replenishment cycle.",
          ],
        },
        {
          title: "Opportunity areas",
          items: [
            "Premium assortments are under-indexing in some secondary route clusters.",
            "Pricing and promotion mix can improve category conversion in city hubs.",
            "More granular product-level demand by territory will sharpen planning.",
          ],
        },
      ]}
      nextActions={[
        "Refresh the product trend review for the top territories.",
        "Inspect pricing and promotion shifts by channel.",
        "Monitor stock risk in the Central region.",
        "Prepare a category health summary for the next review.",
      ]}
    />
  );
}
