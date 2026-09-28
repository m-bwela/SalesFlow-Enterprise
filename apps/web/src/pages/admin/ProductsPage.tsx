import { BarChart3, Gauge, Package, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Catalog health",
          items: [
            "The catalog remains active and aligned to current commercial priorities.",
            "A handful of SKUs need re-review due to reduced movement or stock risk.",
            "The next cycle will focus on better category balancing and pricing alignment.",
          ],
        },
        {
          title: "Commercial priorities",
          items: [
            "Demand remains strongest in beverage and fast-moving staples categories.",
            "A few slow movers require attention to avoid dead stock accumulation.",
            "Next cycle planning will focus on assortment rationalization and SKU health.",
          ],
        },
      ]}
      nextActions={[
        "Review the flagged stock-risk SKUs.",
        "Adjust the pricing and promotion plan by category.",
        "Confirm the insertion of the new product mix.",
        "Prepare a catalog health review with sales leads.",
      ]}
    />
  );
}
