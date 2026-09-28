import { Activity, Gauge, MapPinned } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function RoutesPage() {
  return (
    <AdminOverviewPage
      title="Routes"
      description="Manage route plans, daily execution, and regional movement coverage."
      metrics={[
        { title: "Open routes", value: "42", description: "Pending execution", icon: MapPinned },
        { title: "Completed", value: "318", description: "This week", icon: Activity },
        { title: "Coverage", value: "91%", description: "Planned coverage", icon: Gauge },
        { title: "Avg route time", value: "4.7h", description: "Per day", icon: Activity },
      ]}
      sections={[
        {
          title: "Route execution",
          items: [
            "Route execution remains steady with improved clustering around key distributor hubs.",
            "A few remote routes still require rescheduling to optimize daily coverage.",
            "The route planning team is aligning today’s coverage with stock availability and visit priority.",
          ],
        },
        {
          title: "Coverage notes",
          items: [
            "Urban route execution remains strong and consistent.",
            "Remote coverage needs more load balancing and timed rescheduling.",
            "The main goal remains optimized completion without overloading the route team.",
          ],
        },
      ]}
      nextActions={[
        "Reschedule the few delayed remote routes.",
        "Review route clustering around distributor hubs.",
        "Track coverage performance by cluster and territory.",
        "Update route managers on the revised route plan.",
      ]}
    />
  );
}
