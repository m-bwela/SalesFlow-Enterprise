import { Activity, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function ReportsPage() {
  return (
    <AdminOverviewPage
      title="Reports"
      description="Pull summaries for sales, operations, inventory, and organizational performance."
      metrics={[
        { title: "Monthly reports", value: "18", description: "Generated this cycle", icon: FileText },
        { title: "Pending exports", value: "3", description: "Waiting for review", icon: ClipboardCheck },
        { title: "Audit checks", value: "100%", description: "Completed", icon: ShieldCheck },
        { title: "Last sync", value: "09:15 AM", description: "System update", icon: Activity },
      ]}
      sections={[
        {
          title: "Report status",
          items: [
            "The monthly operations summary has been generated and queued for distribution.",
            "Regional managers can review performance by territory, distributor, and month.",
            "Audit logs are clean and the reporting pipeline remains synchronized with source data.",
          ],
        },
        {
          title: "Review queue",
          items: [
            "Three exports are waiting on final sign-off from stakeholders.",
            "Leadership review is scheduled for the next operating cycle.",
            "Data checks are complete and ready for broader distribution.",
          ],
        },
      ]}
      nextActions={[
        "Send the monthly summary to regional heads.",
        "Complete the remaining export approvals.",
        "Check audit trail completeness before sign-off.",
        "Schedule the next report distribution window.",
      ]}
    />
  );
}
