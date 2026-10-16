import { useState } from "react";
import { ArrowRightLeft, LogIn, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userManagementService, type OnlineUser } from "@/services/userManagement.service";

export const ROLES = [
  ["ADMIN", "Admin"], ["SUPER_ADMIN", "Super Admin"], ["RSM", "Regional Sales Manager"],
  ["GT_TSM", "General Trade TSM"], ["MT_TSM", "Modern Trade TSM"], ["MTSR", "Mtsr"],
  ["ASR", "Field Sales Agent"], ["DISTRIBUTOR", "Distributor"], ["HORECA", "Horeca"],
  ["SUPPORT", "Support"], ["CFO", "CFO"], ["FINANCE", "Finance"],
] as const;
export const roleLabel = (code: string) => ROLES.find(([c]) => c === code)?.[1] ?? code;

type Step = "menu" | "role";
const cards = [
  { k: "role", label: "Change role", hint: "Reassign permissions", Icon: ArrowRightLeft },
  { k: "edit", label: "Edit", hint: "Update details", Icon: Pencil },
  { k: "login", label: "Login", hint: "View as this user", Icon: LogIn },
] as const;

type Props = {
  user: OnlineUser | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  onEdit?: (userId: string) => void; // hook up your existing edit dialog here
};

export function UserActions({ user, open, onClose, onChanged, onEdit }: Props) {
  const [step, setStep] = useState<Step>("menu");
  const [roleCode, setRoleCode] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => { setStep("menu"); onClose(); };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  const pick = async (k: string) => {
    if (k === "role") { setRoleCode(user.role ?? ""); setStep("role"); return; }
    if (k === "edit") {
      if (onEdit) { onEdit(user.id); close(); } else toast.info("Connect your existing edit dialog here");
      return;
    }
    // k === "login"
    if (await run(() => userManagementService.impersonate(user.id), "Opening session…")) {
      window.location.assign("/");
    }
  };

  const saveRole = async () => {
    if (await run(() => userManagementService.changeRole(user.id, roleCode), "Role updated")) {
      onChanged();
      close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === "menu" ? user.displayName : "Change role"}</DialogTitle>
          <DialogDescription>{user.role ? roleLabel(user.role) : "No role"} · {user.department}</DialogDescription>
        </DialogHeader>

        {step === "menu" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(({ k, label, hint, Icon }) => (
              <button key={k} disabled={busy} onClick={() => pick(k)}
                className="rounded-lg border p-4 text-center transition hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2 disabled:opacity-50">
                <Icon className="mx-auto mb-2 h-7 w-7 text-primary" />
                <b className="block">{label}</b>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === "role" && (
          <>
            <div className="space-y-2">
              <Label>New role</Label>
              <Select value={roleCode} onValueChange={setRoleCode}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{ROLES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("menu")}>Back</Button>
              <Button disabled={busy || !roleCode} onClick={saveRole}>Save role</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}