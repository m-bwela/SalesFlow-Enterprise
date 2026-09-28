import { Activity, Gauge, MapPinned } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function RouteActivityPage() {
  return (
    <AdminOverviewPage
      title="Route Activity"
      description="Review field movement, time spent, and visit completion by route."
      metrics={[
        { title: "Visits today", value: "267", description: "Recorded activities", icon: Activity },
        { title: "On-time", value: "91%", description: "Visit completion", icon: Gauge },
        { title: "Delayed stops", value: "18", description: "Needs follow-up", icon: Activity },
        { title: "Distance covered", value: "1,860 km", description: "Today", icon: MapPinned },
      ]}
      sections={[
        {
          title: "Field movement",
          items: [
            "The route distribution team maintained a strong on-time rate for the morning cycle.",
            "Traffic and road conditions caused a few delays in the South corridor.",
            "Review is recommended for the last 3 delayed route clusters.",
          ],
        },
        {
          title: "Follow-up actions",
          items: [
            "High-priority delayed stops need quick follow-up from the field team.",
            "Morning route coverage remains strong with low disruption in the busiest clusters.",
            "The improved route timing is having a measurable effect on completion rates.",
          ],
        },
      ]}
      nextActions={[
        "Review the delayed stops in the South corridor.",
        "Reassign follow-up coverage for route clusters with low completion.",
        "Share updated route completion data with the field managers.",
        "Prepare the next route review summary.",
      ]}
    />
  );
}
