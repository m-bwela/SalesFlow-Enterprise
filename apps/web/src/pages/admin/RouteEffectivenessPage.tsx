import { Activity, Gauge, MapPinned, TrendingUp } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function RouteEffectivenessPage() {
  return (
    <AdminOverviewPage
      title="Route Effectiveness"
      description="Compare route quality, outlet conversion, and rep productivity."
      metrics={[
        { title: "Effectiveness", value: "87%", description: "Average score", icon: Gauge },
        { title: "Conversion", value: "54%", description: "Order conversion", icon: TrendingUp },
        { title: "Avg stop time", value: "17 min", description: "Per outlet", icon: Activity },
        { title: "Best route", value: "NBO-04", description: "Top performance", icon: MapPinned },
      ]}
      sections={[
        {
          title: "Performance review",
          items: [
            "High-performing routes are driven by better outlet sequencing and predictable follow-up timing.",
            "Conversion remains strongest where route planning aligns with distributor delivery windows.",
            "The underperforming routes need intervention on volume planning and call discipline.",
          ],
        },
        {
          title: "Improvement plan",
          items: [
            "The strongest improvement opportunities are in route sequencing and outlet prioritization.",
            "Lower-performing routes are being compared against performance benchmarks.",
            "A targeted coaching plan will help improve conversion quality and route discipline.",
          ],
        },
      ]}
      nextActions={[
        "Compare the best and worst-performing routes side by side.",
        "Review volume planning in the underperforming routes.",
        "Prepare coaching actions for the low-conversion teams.",
        "Share route effectiveness updates with the operations lead.",
      ]}
    />
  );
}
