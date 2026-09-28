import { Activity, Gauge, Package, Warehouse } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function WarehousesPage() {
  return (
    <AdminOverviewPage
      title="Warehouses"
      description="Monitor stock hubs, inventory flow, and distribution points."
      metrics={[
        { title: "Warehouses", value: "23", description: "Operational hubs", icon: Warehouse },
        { title: "Utilization", value: "78%", description: "Average stock use", icon: Gauge },
        { title: "Ready to dispatch", value: "91%", description: "In-stock availability", icon: Package },
        { title: "Pending transfers", value: "14", description: "In transit", icon: Activity },
      ]}
      sections={[
        {
          title: "Warehouse status",
          items: [
            "Warehouse utilization remains stable and within target thresholds.",
            "Most dispatch delays are caused by last-mile transfer planning and stock balancing.",
            "The operations team is prioritizing a few high-volume transfer requests before the next cycle.",
          ],
        },
        {
          title: "Distribution notes",
          items: [
            "Transfer prioritization remains the main operational focus for the next cycle.",
            "The strongest warehouse performance is tied to better cross-region balancing.",
            "A handful of hubs need more active stock balancing to keep dispatch rates high.",
          ],
        },
      ]}
      nextActions={[
        "Prioritize the high-volume transfer requests.",
        "Review stock balancing in the busiest hubs.",
        "Confirm dispatch readiness before the next run.",
        "Prepare a warehouse utilization summary for operations.",
      ]}
    />
  );
}
