import { Activity, ClipboardCheck, Gauge, Warehouse } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function InventoryPage() {
  return (
    <AdminOverviewPage
      title="Inventory"
      description="Monitor stock availability and movement across sales channels and warehouses."
      metrics={[
        { title: "Available stock", value: "92%", description: "Current fill rate", icon: Warehouse },
        { title: "Reorder queue", value: "16", description: "Products flagged", icon: ClipboardCheck },
        { title: "Fast movers", value: "39", description: "High velocity items", icon: Activity },
        { title: "Transfers", value: "14", description: "Pending moves", icon: Activity },
      ]}
      sections={[
        {
          title: "Inventory coverage",
          items: [
            "Inventory coverage is stable across the network with most high-demand SKUs available.",
            "A few categories require better replenishment visibility to prevent stock-out risk.",
            "Operations is aligning transfer priorities to the highest-velocity product lines.",
          ],
        },
        {
          title: "Watch list",
          items: [
            "High-velocity SKUs should remain the primary replenishment focus.",
            "A few replenishment triggers remain in progress for lower-coverage categories.",
            "Better utilization of cross-hub transfer activity will improve coverage.",
          ],
        },
      ]}
      nextActions={[
        "Prioritize replenishment for the fast-moving SKUs.",
        "Review the reorder queue across supply nodes.",
        "Confirm transfer priority for the current cycle.",
        "Prepare the next inventory performance review.",
      ]}
    />
  );
}
