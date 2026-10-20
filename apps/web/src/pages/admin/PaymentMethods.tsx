import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, History, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
// Needs the packages/shared workspace (@salesflow/shared) linked into apps/web.
import {
  FLAGS, FLAG_KEYS, PAYMENT_CODES,
  type AuditDTO, type PaymentMethodCode, type PaymentMethodDTO,
} from "@salesflow/shared";


const BASE = "/api/v1/payment-methods";

// Uses your apiFetch: base URL, cookies and ApiError (its message is shown in the error banner).
const api = async <T,>(path = "", method = "GET", body?: unknown): Promise<T> =>
  (await apiFetch<{ data: T }>(`${BASE}${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })).data;

type DialogState =
  | { type: "add" }
  | { type: "edit" | "history" | "delete"; method: PaymentMethodDTO }
  | null;

const fmt = (iso: string) => new Date(iso).toLocaleString();
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodDTO[]>([]);
  const [audit, setAudit] = useState<AuditDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const loadAudit = useCallback(() => {
  api<AuditDTO[]>("/audit")
    .then(list => setAudit(Array.isArray(list) ? list : []))
    .catch(() => undefined);
}, []);

  useEffect(() => {
  api<PaymentMethodDTO[]>()
    .then(list => setMethods(Array.isArray(list) ? list : []))
    .catch(e => setError(msg(e)))
    .finally(() => setLoading(false));
  loadAudit();
}, [loadAudit]);

  // Every mutation returns the fresh list, so the table always mirrors the database.
  async function run(path: string, method: string, body?: unknown): Promise<boolean> {
    try {
      setMethods(await api<PaymentMethodDTO[]>(path, method, body));
      setError("");
      loadAudit();
      return true;
    } catch (e) {
      setError(msg(e));
      return false;
    }
  }

  const freeCodes = PAYMENT_CODES.filter(c => !methods.some(m => m.code === c));

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <DashboardHeader
            title="Payment Methods"
            description={
              "Codes are hard-coded; admins choose from MPESA / Cash / Bank / Credit and toggle per-role availability. " +
              "Every change is audited and emailed to Admin / CFO / Finance."
            }
          />

          <div className="flex items-center gap-3">
            <Button disabled={!freeCodes.length} onClick={() => setDialog({ type: "add" })}>
              <Plus className="size-4" /> Add Method
            </Button>
            {!freeCodes.length && !loading && (
              <span className="text-sm text-muted-foreground">All four codes are already in use.</span>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">ICON</TableHead>
                  <TableHead>CODE</TableHead>
                  <TableHead>LABEL</TableHead>
                  <TableHead className="text-center">ACTIVE</TableHead>
                  {FLAG_KEYS.map(k => <TableHead key={k} className="text-center">{FLAGS[k]}</TableHead>)}
                  <TableHead className="text-center">ORDER</TableHead>
                  <TableHead className="text-center">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={14} className="py-8 text-center text-muted-foreground">Loading payment methods…</TableCell></TableRow>
                )}
                {!loading && !methods.length && (
                  <TableRow><TableCell colSpan={14} className="py-8 text-center text-muted-foreground">No payment methods yet. Use + Add Method to enable one.</TableCell></TableRow>
                )}
                {methods.map((m, i) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-center">
                      <span className="inline-grid size-9 place-items-center rounded-lg bg-primary/10 text-lg" aria-hidden>{m.icon}</span>
                    </TableCell>
                    <TableCell className={cn("font-semibold", !m.isActive && "opacity-55")}>{m.code}</TableCell>
                    <TableCell className={cn(!m.isActive && "opacity-55")}>{m.label}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={m.isActive}
                        aria-label={`Active: ${m.code}`}
                        onCheckedChange={v => run(`/${m.code}`, "PATCH", { isActive: v })}
                      />
                    </TableCell>
                    {FLAG_KEYS.map(k => (
                      <TableCell key={k} className={cn("text-center", !m.isActive && "opacity-55")}>
                        <FlagCell on={m[k]} label={`${m.code} ${FLAGS[k]}`} onToggle={() => run(`/${m.code}`, "PATCH", { [k]: !m[k] })} />
                      </TableCell>
                    ))}
                    {/* Order and Action must stay inside this row: m and i only exist inside methods.map */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7" disabled={i === 0} aria-label="Move up"
                          onClick={() => run(`/${m.code}/move`, "POST", { direction: "up" })}><ChevronUp className="size-4" /></Button>
                        <span className="w-4 text-center text-sm font-medium">{i + 1}</span>
                        <Button variant="ghost" size="icon" className="size-7" disabled={i === methods.length - 1} aria-label="Move down"
                          onClick={() => run(`/${m.code}/move`, "POST", { direction: "down" })}><ChevronDown className="size-4" /></Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setDialog({ type: "edit", method: m })}><Pencil className="size-3.5" /> Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => setDialog({ type: "history", method: m })}><History className="size-3.5" /> History</Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                          onClick={() => setDialog({ type: "delete", method: m })}><Trash2 className="size-3.5" /> Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold">Audit log</h2>
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {!audit.length && <li className="p-4 text-muted-foreground">No changes recorded yet.</li>}
              {audit.map(a => (
                <li key={a.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                  <span><b>{a.methodCode}</b> {a.detail} <span className="text-muted-foreground">by {a.actorName ?? "unknown"}</span></span>
                  <time className="text-muted-foreground">{fmt(a.createdAt)}</time>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <MethodDialog dialog={dialog} freeCodes={freeCodes} run={run} onClose={() => setDialog(null)} />
      </PageContainer>
    </AppShell>
  );
}

function FlagCell({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <Button
      variant="ghost" size="icon" onClick={onToggle} aria-pressed={on} aria-label={label}
      className={cn("h-8 w-9 border", on ? "border-primary bg-primary/10 text-primary hover:bg-primary/15" : "border-transparent text-muted-foreground")}
    >
      {on ? <Check className="size-4" /> : <Minus className="size-4" />}
    </Button>
  );
}

interface DialogProps {
  dialog: DialogState;
  freeCodes: PaymentMethodCode[];
  run: (path: string, method: string, body?: unknown) => Promise<boolean>;
  onClose: () => void;
}

function MethodDialog({ dialog, freeCodes, run, onClose }: DialogProps) {
  const [label, setLabel] = useState("");
  const [code, setCode] = useState<PaymentMethodCode | "">("");
  const [history, setHistory] = useState<AuditDTO[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset local state each time a dialog opens.
  useEffect(() => {
    setBusy(false);
    setHistory(null);
    if (dialog?.type === "edit") setLabel(dialog.method.label);
    if (dialog?.type === "add") setCode(freeCodes[0] ?? "");
    if (dialog?.type === "history")
      api<AuditDTO[]>(`/audit?code=${dialog.method.code}`).then(setHistory).catch(() => setHistory([]));
  }, [dialog]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(ok: Promise<boolean>) {
    setBusy(true);
    if (await ok) onClose(); else setBusy(false);
  }

  return (
    <Dialog open={dialog !== null} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {dialog?.type === "add" && (
          <>
            <DialogHeader>
              <DialogTitle>Add payment method</DialogTitle>
              <DialogDescription>Choose one of the hard-coded codes. It starts active with nothing enabled.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Code</Label>
              <Select value={code} onValueChange={v => setCode(v as PaymentMethodCode)}>
                <SelectTrigger><SelectValue placeholder="Select a code" /></SelectTrigger>
                <SelectContent>{freeCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button disabled={!code || busy} onClick={() => submit(run("", "POST", { code }))}>Add method</Button>
            </DialogFooter>
          </>
        )}

        {dialog?.type === "edit" && (
          <>
            <DialogHeader>
              <DialogTitle>Edit {dialog.method.code}</DialogTitle>
              <DialogDescription>The code is fixed. You can change the label shown to users.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="pm-label">Label</Label>
              <Input id="pm-label" value={label} maxLength={30} onChange={e => setLabel(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button disabled={!label.trim() || busy} onClick={() => submit(run(`/${dialog.method.code}`, "PATCH", { label }))}>Save changes</Button>
            </DialogFooter>
          </>
        )}

        {dialog?.type === "history" && (
          <>
            <DialogHeader>
              <DialogTitle>{dialog.method.code} history</DialogTitle>
              <DialogDescription>Changes to this method.</DialogDescription>
            </DialogHeader>
            <div className="max-h-72 overflow-y-auto text-sm">
              {history === null && <p className="text-muted-foreground">Loading…</p>}
              {history?.length === 0 && <p className="text-muted-foreground">No changes recorded yet.</p>}
              <ul className="divide-y">
                {history?.map(a => (
                  <li key={a.id} className="py-2">
                    {a.detail}
                    <div className="text-xs text-muted-foreground">{a.actorName ?? "unknown"} · {fmt(a.createdAt)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
          </>
        )}

        {dialog?.type === "delete" && (
          <>
            <DialogHeader>
              <DialogTitle>Delete {dialog.method.code}?</DialogTitle>
              <DialogDescription>
                Users will no longer be able to pay with {dialog.method.label}. The deletion is audited and emailed to Admin,
                CFO and Finance. You can add the code back later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="destructive" disabled={busy} onClick={() => submit(run(`/${dialog.method.code}`, "DELETE"))}>Delete method</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}