import { ClipboardCheck, Gauge, ShieldCheck, Store, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function ASRManagementPage() {
  return (
    <AdminOverviewPage
      title="ASR Management"
      description="Supervise ASR assignment, accountability, and field performance."
      metrics={[
        { title: "Assigned ASRs", value: "74", description: "Current roster", icon: Users },
        { title: "Open tasks", value: "9", description: "Pending follow-up", icon: ClipboardCheck },
        { title: "Performance", value: "89%", description: "Average score", icon: Gauge },
        { title: "Account coverage", value: "318", description: "Managed outlets", icon: Store },
      ]}
      sections={[
        {
          title: "Management snapshot",
          items: [
            "ASR management remains active with close attention to outreach and account coverage.",
            "A few field representatives require coaching on route discipline and dispatch timing.",
            "Standardized weekly review helps maintain accountability and target delivery.",
          ],
        },
        {
          title: "Operational notes",
          items: [
            "Field follow-up remains most valuable when aligned to the highest-priority outlets.",
            "The strongest results continue to come from consistent route discipline and timing.",
            "A small set of open tasks requires quick manager attention.",
          ],
        },
      ]}
      nextActions={[
        "Review the current ASR task backlog.",
        "Coach the underperforming routes in the next cycle.",
        "Confirm outlet assignment coverage by territory.",
        "Prepare the ASR review summary for the leadership team.",
      ]}
    />
  );
}
