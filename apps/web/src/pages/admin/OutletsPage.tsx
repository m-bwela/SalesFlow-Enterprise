import { Activity, Gauge, Store, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Outlet coverage",
          items: [
            "Coverage continues to expand in the Coast and Nairobi territories.",
            "Inactive outlets are being reviewed to determine whether they require reactivation or removal.",
            "Outlet quality scoring remains strongest in the top-performing urban districts.",
          ],
        },
        {
          title: "Growth opportunities",
          items: [
            "The strongest growth is coming from urban districts with repeat ordering patterns.",
            "Secondary territories need better activation support and customer re-engagement.",
            "A few inactive accounts need a targeted recovery plan.",
          ],
        },
      ]}
      nextActions={[
        "Review inactive outlets before the next cycle.",
        "Prioritize expansion in Coast and Nairobi coverage zones.",
        "Re-engage weak storefronts with targeted activation.",
        "Confirm status of new outlet additions.",
      ]}
    />
  );
}
