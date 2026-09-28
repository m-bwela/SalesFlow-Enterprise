import { Activity, Gauge, ShieldCheck, Users } from "lucide-react";

import { AdminOverviewPage } from "./AdminOverviewPage";

export function UserImpersonationPage() {
  return (
    <AdminOverviewPage
      title="Impersonation"
      description="Manage privileged session switching and administrative access review."
      metrics={[
        { title: "Current sessions", value: "3", description: "Active impersonations", icon: Users },
        { title: "Authorized", value: "11", description: "Configured users", icon: ShieldCheck },
        { title: "Recent actions", value: "24", description: "In last 24 hrs", icon: Activity },
        { title: "Audit score", value: "100%", description: "Review compliance", icon: Gauge },
      ]}
      sections={[
        {
          title: "Session controls",
          items: [
            "Privileged sessions are fully audited and limited to approved admin use cases.",
            "The current impersonation list remains small and controlled by role-based access.",
            "No concerns were raised from the latest review of impersonation activity.",
          ],
        },
        {
          title: "Access quality",
          items: [
            "Privileges remain tightly controlled and reviewed regularly.",
            "Audit coverage is complete for the reviewed sessions.",
            "The current posture remains compliant and operationally safe.",
          ],
        },
      ]}
      nextActions={[
        "Refresh the approved impersonation user list.",
        "Review the last 24 hours of privileged sessions.",
        "Confirm audit coverage for the current admin group.",
        "Prepare the next access review summary.",
      ]}
    />
  );
}
