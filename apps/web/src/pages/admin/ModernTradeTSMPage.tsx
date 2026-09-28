import { Activity, ClipboardCheck, Gauge, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function ModernTradeTSMPage() {
  return (
    <AdminOverviewPage
      title="MT TSM Dashboard"
      description="Review the modern trade team’s execution, call rhythm, and gap closure."
      metrics={[
        { title: "Active TSMs", value: "12", description: "Current team", icon: Users },
        { title: "Visits", value: "214", description: "This week", icon: Activity },
        { title: "Follow-up", value: "31", description: "Pending actions", icon: ClipboardCheck },
        { title: "Coverage", value: "94%", description: "Account coverage", icon: Gauge },
      ]}
      sections={[
        {
          title: "Team execution",
          items: [
            "Modern trade TSM activity remains strong and aligned to key retail programs.",
            "The team is focusing on follow-up planning to close gaps in low-coverage stores.",
            "Operational quality remains strong across assigned customer clusters.",
          ],
        },
        {
          title: "Gap closure",
          items: [
            "Pending follow-ups remain concentrated in lower-coverage retail zones.",
            "Much of the improvement opportunity lies in better route discipline and call rhythm.",
            "TSM teams remain on track for the current cycle target.",
          ],
        },
      ]}
      nextActions={[
        "Close the open TSM follow-ups in low-coverage areas.",
        "Review call rhythm and route discipline with the team.",
        "Confirm retail account coverage by cluster.",
        "Prepare the TSM review for the next cycle.",
      ]}
    />
  );
}
