import { Activity, Gauge, MapPinned, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function OnlineUsersPage() {
  return (
    <AdminOverviewPage
      title="Online Users"
      description="Monitor active platform usage and system engagement."
      metrics={[
        { title: "Online now", value: "143", description: "Connected users", icon: Users },
        { title: "Last 5 min", value: "96", description: "Active sessions", icon: Activity },
        { title: "Regions active", value: "5", description: "Currently online", icon: MapPinned },
        { title: "Avg session", value: "18 min", description: "Current usage", icon: Gauge },
      ]}
      sections={[
        {
          title: "Engagement overview",
          items: [
            "Platform engagement remains consistent across the reporting and field operations teams.",
            "Most active users are concentrated in sales, field management, and operations support.",
            "Monitoring continues to prioritize session health and role-based access checks.",
          ],
        },
        {
          title: "User health",
          items: [
            "Session activity remains stable with no unusual spikes in core clusters.",
            "Most active sessions are measured and healthy across operational teams.",
            "The next review will focus on peak usage and access consistency by role.",
          ],
        },
      ]}
      nextActions={[
        "Review peak usage by team and role.",
        "Check session health for the highest-activity clusters.",
        "Validate access patterns for the active user groups.",
        "Prepare the next online user report.",
      ]}
    />
  );
}
