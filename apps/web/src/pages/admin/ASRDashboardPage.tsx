import { Activity, Gauge, Store, TrendingUp, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function ASRDashboardPage() {
  return (
    <AdminOverviewPage
      title="ASR Dashboard"
      description="Track ASR execution, call activity, and account coverage."
      metrics={[
        { title: "Active ASRs", value: "74", description: "Current team", icon: Users },
        { title: "Visit rate", value: "89%", description: "Planned visits complete", icon: Activity },
        { title: "Submitted orders", value: "641", description: "This week", icon: TrendingUp },
        { title: "Accounts covered", value: "318", description: "Unique outlets", icon: Store },
      ]}
      sections={[
        {
          title: "Execution overview",
          items: [
            "ASR completion rate is highest in high-volume urban clusters and lower in remote route coverage.",
            "Field visits remain aligned to account priority and coverage targets.",
            "Follow-up actions are needed for a small set of delayed outlet visits.",
          ],
        },
        {
          title: "Coverage priorities",
          items: [
            "Urban clusters remain the strongest coverage zone for the current cycle.",
            "Remote routes need tighter monitoring to prevent missed visits.",
            "The strongest impact will come from better route sequencing and follow-up discipline.",
          ],
        },
      ]}
      nextActions={[
        "Review delayed outlet visits by territory.",
        "Balance ASR workload across high-coverage clusters.",
        "Confirm the status of pending outlet follow-ups.",
        "Prepare the weekly ASR coverage report.",
      ]}
    />
  );
}
