import { BarChart3, ClipboardCheck, Gauge, MapPinned } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function RoutePlansPage() {
  return (
    <AdminOverviewPage
      title="Route Plans"
      description="Coordinate planned route coverage, workload allocation, and approval stages."
      metrics={[
        { title: "Draft plans", value: "12", description: "Pending review", icon: ClipboardCheck },
        { title: "Approved", value: "96", description: "Current cycle", icon: Gauge },
        { title: "Regions", value: "6", description: "Planned coverage", icon: MapPinned },
        { title: "Load balance", value: "83%", description: "Even distribution", icon: BarChart3 },
      ]}
      sections={[
        {
          title: "Planning status",
          items: [
            "The route approval queue is almost fully cleared for the upcoming cycle.",
            "Most plans are balanced across teams, with only minor adjustments still needed in the West.",
            "A few routes are waiting on the latest stock confirmation before final approval.",
          ],
        },
        {
          title: "Planning priorities",
          items: [
            "High-volume territories need load balancing to prevent over-assignment.",
            "A few route plans still require revision based on stock coverage and visit priority.",
            "Future planning will focus on geographic balancing and predicted demand.",
          ],
        },
      ]}
      nextActions={[
        "Approve the remaining route plans in the queue.",
        "Adjust the West region load before the next cycle.",
        "Confirm stock availability for pending final approvals.",
        "Prepare the route plan summary for dispatch managers.",
      ]}
    />
  );
}
