import { Activity, Gauge, ShieldCheck, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function UserActivityPage() {
  return (
    <AdminOverviewPage
      title="User Activity"
      description="Review system access, actions, and accountability across the platform."
      metrics={[
        { title: "Logins today", value: "1,280", description: "Successful sessions", icon: Activity },
        { title: "Failed attempts", value: "12", description: "Needs review", icon: ShieldCheck },
        { title: "Top role", value: "ASR", description: "Most active role", icon: Users },
        { title: "Timeouts", value: "4", description: "Potential issues", icon: Gauge },
      ]}
      sections={[
        {
          title: "Activity summary",
          items: [
            "User activity remains strong with predictable login and session behavior.",
            "Security checks are monitoring a limited set of failed attempts and unusual access patterns.",
            "The operations team will review the few timeout reports for potential device or connectivity issues.",
          ],
        },
        {
          title: "Security review",
          items: [
            "The current activity mix remains within expected operating behavior.",
            "Failed attempts are low and limited to a small set of user sessions.",
            "Access logs remain stable and require only routine monitoring.",
          ],
        },
      ]}
      nextActions={[
        "Review the failed login attempts.",
        "Check the timeout cases for device or connectivity issues.",
        "Confirm the current session mix by role.",
        "Prepare a brief user activity summary for security.",
      ]}
    />
  );
}
