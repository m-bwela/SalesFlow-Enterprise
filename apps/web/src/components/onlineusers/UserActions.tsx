import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, LogIn, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ROLES, roleLabel } from "@/lib/api";

export type OnlineUser = {
  id: string; displayName: string; email: string; phoneNumber: string | null;
  department: string; role: string | null; lastSeenAt: string | null; isOnline: boolean;
};

type Step = "menu" | "role" | "edit";
const cards = [
  { k: "role", label: "Change role", hint: "Reassign permissions", Icon: ArrowRightLeft },
  { k: "edit", label: "Edit", hint: "Update details", Icon: Pencil },
  { k: "login", label: "Login", hint: "View as this user", Icon: LogIn },
] as const;

export function UserActions({ user, open, onClose }: { user: OnlineUser | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("menu");
  const [form, setForm] = useState({ displayName: "", email: "", phoneNumber: "", roleCode: "" });

  const finish = () => {
    qc.invalidateQueries({ queryKey: ["online-users"] });
    setStep("menu");
    onClose();
  };
  const onError = (e: Error) => toast.error(e.message);

  const changeRole = useMutation({
    mutationFn: () => api(`/users/${user!.id}/role`, { method: "PATCH", body: JSON.stringify({ roleCode: form.roleCode }) }),
    onSuccess: () => { toast.success("Role updated"); finish(); }, onError,
  });
  const edit = useMutation({
    mutationFn: () => api(`/users/${user!.id}`, {
      method: "PATCH",
      body: JSON.stringify({ displayName: form.displayName, email: form.email, phoneNumber: form.phoneNumber }),
    }),
    onSuccess: () => { toast.success("User updated"); finish(); }, onError,
  });
  const login = useMutation({
    mutationFn: () => api(`/users/${user!.id}/impersonate`, { method: "POST" }),
    onSuccess: (res) => {
      // TODO: wire to your session flow once the auth pieces are added
      console.log("impersonation session", res);
    }, onError,
  });

  if (!user) return null;
  const pick = (k: string) => {
    if (k === "login") return login.mutate();
    setForm({ displayName: user.displayName, email: user.email, phoneNumber: user.phoneNumber ?? "", roleCode: user.role ?? "" });
    setStep(k as Step);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setStep("menu"); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === "menu" ? user.displayName : step === "role" ? "Change role" : "Edit user"}</DialogTitle>
          <DialogDescription>{user.role ? roleLabel(user.role) : "No role"} · {user.department}</DialogDescription>
        </DialogHeader>

        {step === "menu" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(({ k, label, hint, Icon }) => (
              <button key={k} onClick={() => pick(k)} disabled={k === "login" && login.isPending}
                className="rounded-lg border p-4 text-center transition hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2">
                <Icon className="mx-auto mb-2 h-7 w-7 text-primary" />
                <b className="block">{label}</b>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === "role" && (
          <div className="space-y-2">
            <Label>New role</Label>
            <Select value={form.roleCode} onValueChange={(roleCode) => setForm({ ...form, roleCode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {step === "edit" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {([["displayName", "Display name"], ["email", "Email"], ["phoneNumber", "Phone"]] as const).map(([f, l]) => (
              <div key={f} className="space-y-1">
                <Label>{l}</Label>
                <Input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
          </div>
        )}

        {step !== "menu" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("menu")}>Back</Button>
            <Button disabled={changeRole.isPending || edit.isPending} onClick={() => (step === "role" ? changeRole.mutate() : edit.mutate())}>
              Save changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}