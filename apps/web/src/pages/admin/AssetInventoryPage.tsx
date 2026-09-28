import { Activity, Gauge, Package, Warehouse } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function AssetInventoryPage() {
  return (
    <AdminOverviewPage
      title="Asset Inventory"
      description="Review equipment assignments and stock visibility across the network."
      metrics={[
        { title: "Units tracked", value: "684", description: "Total tracked", icon: Package },
        { title: "Assigned", value: "436", description: "Currently in use", icon: Activity },
        { title: "Available", value: "182", description: "Ready to deploy", icon: Warehouse },
        { title: "At risk", value: "9", description: "Needs follow-up", icon: Gauge },
      ]}
      sections={[
        {
          title: "Inventory visibility",
          items: [
            "The network has enough inventory for most field operations without acute shortages.",
            "A small group of items is due for review based on usage and service history.",
            "Inventory monitoring remains aligned to route and logistics planning requirements.",
          ],
        },
        {
          title: "Operational watch",
          items: [
            "Higher-risk items need review before the next heavy operational period.",
            "The strongest available inventory sits in the most active hubs and service clusters.",
            "The next review will focus on deployment readiness and usage patterns.",
          ],
        },
      ]}
      nextActions={[
        "Review the at-risk inventory group.",
        "Confirm which assets remain available for deployment.",
        "Check usage trends by service cluster.",
        "Prepare the next inventory readiness summary.",
      ]}
    />
  );
}
