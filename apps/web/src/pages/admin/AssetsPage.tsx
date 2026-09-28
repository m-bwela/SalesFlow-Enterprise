import { Activity, ClipboardCheck, Gauge, Package } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function AssetsPage() {
  return (
    <AdminOverviewPage
      title="Assets"
      description="Track business assets, equipment, and operational resources."
      metrics={[
        { title: "Assets", value: "684", description: "Registered assets", icon: Package },
        { title: "Operational", value: "634", description: "Available", icon: Activity },
        { title: "Maintenance", value: "11", description: "Due soon", icon: ClipboardCheck },
        { title: "Risk items", value: "8", description: "Needs attention", icon: Gauge },
      ]}
      sections={[
        {
          title: "Asset status",
          items: [
            "Asset coverage remains healthy across core operational regions.",
            "A few maintenance records need follow-up before the next planning cycle.",
            "Asset tracking continues to support service reliability and distribution readiness.",
          ],
        },
        {
          title: "Maintenance notes",
          items: [
            "The maintenance queue is manageable but needs regular monitoring.",
            "Critical equipment should be reviewed before the next high-uptime period.",
            "Operational continuity is stable while preventive maintenance is underway.",
          ],
        },
      ]}
      nextActions={[
        "Review the maintenance queue for priority assets.",
        "Check the risk items before the next planning cycle.",
        "Confirm equipment readiness across active operational hubs.",
        "Prepare an asset health report for leadership.",
      ]}
    />
  );
}
