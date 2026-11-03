import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { userManagementService } from "@/services/userManagement.service";

type Status = Awaited<ReturnType<typeof userManagementService.impersonationStatus>>;

export function ImpersonationBanner() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => { userManagementService.impersonationStatus().then(setS).catch(() => undefined); }, []);
  if (!s?.impersonating) return null;

  const exit = async () => {
    try {
      const r = await userManagementService.exitImpersonation();
      const back = sessionStorage.getItem("impersonationReturn");
      sessionStorage.removeItem("impersonationReturn");
      window.location.assign(r.restored ? back ?? "/" : "/login");   // adjust "/login" to your login path
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not exit the session"); }
  };

  return (
    <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-1 bg-amber-600 px-4 py-2 text-sm text-white">
      <b>Viewing as {s.userName}</b>
      <span>Changes you make are saved in their name and logged under {s.adminName}.{s.expiresAt && ` Ends at ${new Date(s.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`}</span>
      <Button size="sm" variant="secondary" className="ml-auto" onClick={exit}>Exit session</Button>
    </div>
  );
}