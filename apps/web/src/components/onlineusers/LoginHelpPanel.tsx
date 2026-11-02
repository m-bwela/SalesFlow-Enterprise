import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, LogOut, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { userManagementService, type LoginDiagnostics } from "@/services/userManagement.service";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "Never");

export function LoginHelpPanel({ userId, onChanged }: { userId: string; onChanged: () => void }) {
  const [d, setD] = useState<LoginDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setD(await userManagementService.diagnostics(userId)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load account details"); }
  }, [userId]);
  useEffect(() => { setD(null); setTempPassword(null); load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await load(); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (!window.confirm("Reset this user's password? They will be signed out everywhere and must use the temporary password.")) return;
    setBusy(true);
    try { setTempPassword((await userManagementService.resetPassword(userId)).temporaryPassword); await load(); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not reset the password"); }
    finally { setBusy(false); }
  };

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!d) return <p className="text-sm text-muted-foreground">Checking account…</p>;

  return (
    <div className="space-y-4 text-sm">
      <div className={`rounded-md border p-3 ${d.problems.length ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-500/40 bg-emerald-500/5"}`}>
        {d.problems.length ? (
          <>
            <p className="mb-1 font-medium">Possible reasons they can't sign in</p>
            <ul className="list-inside list-disc space-y-0.5">{d.problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </>
        ) : (
          <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />The account looks fine. Most likely a forgotten password or wrong email.</p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Status</dt><dd>{d.status}</dd>
        <dt className="text-muted-foreground">Last login</dt><dd>{when(d.lastLoginAt)}</dd>
        <dt className="text-muted-foreground">Active sessions</dt><dd>{d.activeSessions}</dd>
        <dt className="text-muted-foreground">Wrong passwords (24h)</dt><dd>{d.failedAttempts.length}</dd>
        {d.locked && <><dt className="text-muted-foreground">Locked until</dt><dd>{when(d.lockedUntil)}</dd></>}
      </dl>

      {d.failedAttempts.length > 0 && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">Recent failed attempts</summary>
          <ul className="mt-1 space-y-0.5 text-xs">{d.failedAttempts.map((a, i) => <li key={i}>{when(a.createdAt)}{a.ipAddress ? ` · ${a.ipAddress}` : ""}</li>)}</ul>
        </details>
      )}

      {tempPassword && (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
          <p className="mb-1 font-medium">Temporary password (shown once)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1 font-mono">{tempPassword}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Copied"); }}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Share it with the user privately and ask them to change it after signing in.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {d.locked && <Button size="sm" disabled={busy} onClick={() => run(() => userManagementService.unlock(userId), "Account unlocked")}><Unlock className="mr-1 h-3.5 w-3.5" />Unlock</Button>}
        {d.status !== "ACTIVE" && d.status !== "ARCHIVED" && <Button size="sm" disabled={busy} onClick={() => run(() => userManagementService.updateStatus(userId, "ACTIVE"), "Account activated")}><ShieldCheck className="mr-1 h-3.5 w-3.5" />{d.status === "PENDING" ? "Approve & activate" : "Reactivate"}</Button>}
        <Button size="sm" variant="outline" disabled={busy} onClick={reset}><KeyRound className="mr-1 h-3.5 w-3.5" />Reset password</Button>
        <Button size="sm" variant="outline" disabled={busy || d.activeSessions === 0} onClick={() => run(() => userManagementService.checkout(userId), "Signed out everywhere")}><LogOut className="mr-1 h-3.5 w-3.5" />Sign out everywhere</Button>
      </div>
    </div>
  );
}