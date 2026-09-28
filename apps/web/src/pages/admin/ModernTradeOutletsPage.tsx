import { Activity, Gauge, Store, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Outlet health",
          items: [
            "Outlets in major city centres continue to deliver robust sales and better order frequency.",
            "Coverage is improving in secondary retail clusters with new account activation.",
            "The next review will focus on spend quality and category mix by store profile.",
          ],
        },
        {
          title: "Growth areas",
          items: [
            "City-centre outlets remain the highest-value retail partners.",
            "Secondary trade clusters need a sharper activation approach.",
            "Better category planning should improve share of wallet across the network.",
          ],
        },
      ]}
      nextActions={[
        "Review secondary cluster outlet coverage.",
        "Support new activation in under-served retail areas.",
        "Improve category mix in the highest-volume outlets.",
        "Prepare the next outlet performance brief.",
      ]}
    />
  );
}
