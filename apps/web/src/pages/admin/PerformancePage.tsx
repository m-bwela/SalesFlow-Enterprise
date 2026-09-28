import { Activity, Gauge, MapPinned, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

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
      sections={[
        {
          title: "Execution highlights",
          items: [
            "Regional teams hit the highest score in the last 7-day cycle for order conversion.",
            "Route completion remains strongest in urban territories with minimal disruptions.",
            "Focus remains on reducing missed calls and replenishment delays in the West.",
          ],
        },
        {
          title: "Team performance",
          items: [
            "Sales and field managers are tracking against weighted key deliverables.",
            "The strongest results are coming from regular route planning and call discipline.",
            "A few teams need coaching to close the gap on conversion quality.",
          ],
        },
      ]}
      nextActions={[
        "Review the region scorecard and closure plan.",
        "Identify underperforming reps for targeted coaching.",
        "Rebalance route schedules in the western territory.",
        "Prepare weekly performance review for leadership.",
      ]}
    />
  );
}
