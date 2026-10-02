import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowDownWideNarrow,
  Check,
  Clock3,
  FileImage,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserRoundPlus,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { userManagementService, type ManagedUser, type UserManagementOverview } from "@/services/userManagement.service";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";

type UserFilter =
  | "all"
  | "pending"
  | "admin"
  | "rsm"
  | "tsm"
  | "asr"
  | "mtsr"
  | "distributor"
  | "online"
  | "login-attempts"
  | "archived";

const userFilters: Array<{ label: string; value: UserFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Admin", value: "admin" },
  { label: "RSMs", value: "rsm" },
  { label: "TSMs", value: "tsm" },
  { label: "ASRs", value: "asr" },
  { label: "MTSRs", value: "mtsr" },
  { label: "Distributors", value: "distributor" },
  { label: "Online", value: "online" },
  { label: "Login attempts", value: "login-attempts" },
  { label: "Archived", value: "archived" },
];

const departments = ["Administration", "IT", "Accounts", "Marketing", "Operations", "Sales", "Support"];
const roleOptions = [
  "Admin",
  "Regional Sales Manager",
  "Territory Sales Manager",
  "Distributor",
  "Field Sales Agent",
  "Mtsr",
  "Horeca",
  "Support",
  "Super Admin",
];
const transportTypes = ["Company car", "Personal car", "Motorcycle", "Bicycle", "Walking", "None"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function Modal({ title, icon: Icon, onClose, children, size = "max-w-2xl" }: {
  title: string;
  icon?: typeof UserRoundPlus;
  onClose: () => void;
  children: ReactNode;
  size?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-label={title} className={`my-auto w-full ${size} rounded-lg border bg-background shadow-2xl`}>
        <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">{Icon && <Icon className="size-5 text-primary" />}{title}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}><X /></Button>
        </header>
        {children}
      </section>
    </div>
  );
}

function LineChart({ data }: { data: UserManagementOverview["signups"] }) {
  const width = 720;
  const height = 210;
  const max = Math.max(...data.map(({ count }) => count), 1);
  const points = data.map(({ count }, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - 18 - (count / max) * (height - 36);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="Daily new user registrations over the last 30 days">
        {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={width} y1={18 + line * 56} y2={18 + line * 56} stroke="currentColor" className="text-border" strokeDasharray="3 5" />)}
        <polyline points={points} fill="none" stroke="#2eae78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date.slice(5) ?? ""}</span>
        <span>{data[14]?.date.slice(5) ?? ""}</span>
        <span>{data.at(-1)?.date.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

function Bars({ data }: { data: UserManagementOverview["topActiveUsers"] }) {
  const max = Math.max(...data.map(({ count }) => count), 1);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No successful logins recorded this week yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((user) => (
        <div key={user.userId} className="grid grid-cols-[minmax(6rem,1fr)_3fr_auto] items-center gap-3 text-sm">
          <span className="truncate">{user.name}</span>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max((user.count / max) * 100, 2)}%` }} />
          </div>
          <span className="w-8 text-right text-xs text-muted-foreground">{user.count}</span>
        </div>
      ))}
    </div>
  );
}

function UserCreateDialog({
  overview,
  onClose,
  onCreated,
}: {
  overview: UserManagementOverview;
  onClose: () => void;
  onCreated: (department?: { id: string; name: string }) => void;
}) {
  const [departmentId, setDepartmentId] = useState("");
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addDepartment() {
    try {
      const response = await userManagementService.createDepartment(newDepartment);
      setDepartmentId(response.data.id);
      setAddingDepartment(false);
      setNewDepartment("");
      onCreated(response.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not add department.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const values = new FormData(form);
    if (!departmentId) {
      setError("Choose a department or add one before creating the user.");
      return;
    }

    const password = String(values.get("password") ?? "");
    if (password.length < 8 || !/^[A-Z]/.test(password)) {
      setError("Use at least 8 characters and start the password with a capital letter.");
      return;
    }

    values.set("departmentId", departmentId);
    values.delete("department");
    setSaving(true);
    try {
      await userManagementService.createUser(values);
      onClose();
      await onCreated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create this user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add New User" icon={UserRoundPlus} onClose={onClose} size="max-w-4xl">
      <form onSubmit={submit} className="max-h-[82vh] space-y-5 overflow-y-auto px-5 py-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm">First Name *<Input name="firstName" required autoComplete="given-name" /></label>
          <label className="space-y-1.5 text-sm">Surname *<Input name="surname" required autoComplete="family-name" /></label>
          <label className="space-y-1.5 text-sm">Email *<Input name="email" type="email" required autoComplete="email" /></label>
          <label className="space-y-1.5 text-sm">Telephone *<Input name="phone" type="tel" required autoComplete="tel" /></label>

          <div className="space-y-1.5 text-sm">
            <span>Department *</span>
            <div className="flex gap-2">
              <select className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm" value={departmentId} required onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">Select department</option>
                {departments.map((department) => <option key={department} value={overview.departments.find((item) => item.name === department)?.id ?? ""}>{department}</option>)}
                {overview.departments.filter((department) => !departments.includes(department.name)).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
              <Button type="button" variant="outline" size="icon" aria-label="Add department" title="Add department" onClick={() => setAddingDepartment((current) => !current)}><Plus /></Button>
            </div>
            {addingDepartment && (
              <div className="flex gap-2 pt-2">
                <Input aria-label="New department name" placeholder="Department name" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} />
                <Button type="button" size="sm" onClick={addDepartment}>Save</Button>
              </div>
            )}
          </div>
          <label className="space-y-1.5 text-sm">Role *
            <select name="roleLabel" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" required defaultValue="">
              <option value="" disabled>Select role</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">Transport type *
            <select name="transportType" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" required defaultValue="">
              <option value="" disabled>Select transport</option>{transportTypes.map((transport) => <option key={transport}>{transport}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Residential address</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">Region<Input name="homeRegion" autoComplete="address-level1" /></label>
            <label className="space-y-1.5 text-sm">City / Town<Input name="city" autoComplete="address-level2" /></label>
            <label className="space-y-1.5 text-sm">Street name<Input name="streetName" autoComplete="street-address" /></label>
            <label className="space-y-1.5 text-sm">Block number<Input name="blockNumber" /></label>
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">National ID</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">ID Front *<Input name="nationalIdFront" type="file" accept="image/png,image/jpeg,image/pdf" required /></label>
            <label className="space-y-1.5 text-sm">ID Back *<Input name="nationalIdBack" type="file" accept="image/png,image/jpeg,image/pdf" required /></label>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" />Files are stored privately and require admin permission to view.</p>
        </fieldset>

        <label className="block space-y-1.5 text-sm">Password *
          <Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
          <span className="block text-xs text-muted-foreground">At least 8 characters; the first character must be uppercase.</span>
        </label>

        {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <footer className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create user"}</Button>
        </footer>
      </form>
    </Modal>
  );
}

function ShiftEditor({
  overview,
  onClose,
  onSaved,
}: {
  overview: UserManagementOverview;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await userManagementService.updateShift({
        closeStart: String(values.get("closeStart")),
        closeEnd: String(values.get("closeEnd")),
        reopenAt: String(values.get("reopenAt")),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update shift window.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Configure ASR shift window" icon={Clock3} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5 p-5">
        <p className="text-sm text-muted-foreground">Times use East Africa Time (EAT). The saved schedule is shown to administrators.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">Close begins<Input type="time" name="closeStart" defaultValue={overview.shift.closeStart} required /></label>
          <label className="space-y-1.5 text-sm">Close ends<Input type="time" name="closeEnd" defaultValue={overview.shift.closeEnd} required /></label>
          <label className="space-y-1.5 text-sm">Reopen at<Input type="time" name="reopenAt" defaultValue={overview.shift.reopenAt} required /></label>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <footer className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save window"}</Button>
        </footer>
      </form>
    </Modal>
  );
}

function UserEditDialog({
  user,
  overview,
  onClose,
  onSaved,
}: {
  user: ManagedUser;
  overview: UserManagementOverview;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    values.set("departmentId", String(values.get("departmentId") ?? ""));
    setSaving(true);
    setError(null);
    try {
      await userManagementService.updateUser(user.id, values);
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit user profile" icon={Pencil} onClose={onClose} size="max-w-4xl">
      <form onSubmit={submit} className="max-h-[82vh] space-y-5 overflow-y-auto px-5 py-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm">First Name *<Input name="firstName" required defaultValue={user.firstName} /></label>
          <label className="space-y-1.5 text-sm">Surname *<Input name="surname" required defaultValue={user.surname} /></label>
          <label className="space-y-1.5 text-sm">Email *<Input name="email" type="email" required defaultValue={user.email} /></label>
          <label className="space-y-1.5 text-sm">Telephone *<Input name="phone" type="tel" required defaultValue={user.phone ?? ""} /></label>
          <label className="space-y-1.5 text-sm">Department *
            <select name="departmentId" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" required defaultValue={user.departmentId}>
              <option value="" disabled>Select department</option>
              {overview.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">Role *
            <select name="roleLabel" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" required defaultValue={user.roleCodes.map((code) => ({ ADMIN: "Admin", SUPER_ADMIN: "Super Admin", RSM: "Regional Sales Manager", GT_TSM: "Territory Sales Manager", MT_TSM: "Territory Sales Manager", DISTRIBUTOR: "Distributor", ASR: "Field Sales Agent", MTSR: "Mtsr", HORECA: "Horeca", SUPPORT: "Support" }[code] ?? ""))[0] ?? ""}>
              <option value="" disabled>Select role</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">Transport type *
            <select name="transportType" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" required defaultValue={transportTypes.find((type) => type.toLowerCase() === user.transportType.toLowerCase()) ?? "None"}>
              {transportTypes.map((transport) => <option key={transport}>{transport}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Residential address</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">Region<Input name="homeRegion" defaultValue={user.homeRegion} /></label>
            <label className="space-y-1.5 text-sm">City / Town<Input name="city" defaultValue={user.city} /></label>
            <label className="space-y-1.5 text-sm">Street name<Input name="streetName" defaultValue={user.streetName} /></label>
            <label className="space-y-1.5 text-sm">Block number<Input name="blockNumber" defaultValue={user.blockNumber} /></label>
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">National ID</legend>
          <p className="text-xs text-muted-foreground">Leave a file empty to keep the currently stored image.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">National ID Front<Input name="nationalIdFront" type="file" accept="image/png,image/jpeg/pdf" /></label>
            <label className="space-y-1.5 text-sm">National ID Back<Input name="nationalIdBack" type="file" accept="image/png,image/jpeg/pdf" /></label>
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <footer className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </footer>
      </form>
    </Modal>
  );
}

export function UserManagementPage() {
  const { logout } = useAuth();
  const [overview, setOverview] = useState<UserManagementOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [liveGraph, setLiveGraph] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [shiftOpen, setShiftOpen] = useState(false);

  async function refreshData(showSpinner = true) {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      setOverview(await userManagementService.getOverview());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load user data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshData(false);
  }, []);

  useEffect(() => {
    if (!liveGraph) return;
    const interval = window.setInterval(() => {
      void refreshData(false);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [liveGraph]);

  const visibleUsers = useMemo(() => {
    const users = overview?.users ?? [];
    if (filter === "login-attempts") return [];
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => {
        if (filter === "all") return user.status !== "ARCHIVED";
        if (filter === "pending") return !user.emailVerified && user.status !== "ARCHIVED";
        if (filter === "archived") return user.status === "ARCHIVED";
        if (filter === "online") return user.online;
        if (filter === "admin") return user.roleCodes.some((role) => ["ADMIN", "SUPER_ADMIN"].includes(role));
        if (filter === "rsm") return user.roleCodes.includes("RSM");
        if (filter === "tsm") return user.roleCodes.some((role) => ["GT_TSM", "MT_TSM"].includes(role));
        if (filter === "asr") return user.roleCodes.includes("ASR");
        if (filter === "mtsr") return user.roleCodes.includes("MTSR");
        if (filter === "distributor") return user.roleCodes.includes("DISTRIBUTOR");
        return true;
      })
      .filter((user) => !query || [user.name, user.email, user.phone ?? "", ...user.roles].some((value) => value.toLowerCase().includes(query)))
      .sort((left, right) => {
        if (sortBy === "name") return left.name.localeCompare(right.name);
        if (sortBy === "role") return left.roles.join(",").localeCompare(right.roles.join(","));
        if (sortBy === "department") return left.department.localeCompare(right.department);
        if (sortBy === "logins") return right.loginsThisWeek - left.loginsThisWeek;
        return right.createdAt.localeCompare(left.createdAt);
      });
  }, [filter, overview, search, sortBy]);

  async function runUserAction(user: ManagedUser, action: "activate" | "disable" | "suspend" | "archive" | "unlock" | "checkout") {
    try {
      if (action === "unlock") await userManagementService.unlock(user.id);
      else if (action === "checkout") await userManagementService.checkout(user.id);
      else {
        const status = action === "activate" ? "ACTIVE" : action === "disable" ? "DISABLED" : action === "suspend" ? "SUSPENDED" : "ARCHIVED";
        await userManagementService.updateStatus(user.id, status);
      }
      setNotice(`${user.name} updated.`);
      await refreshData(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this user.");
    }
  }

  async function checkoutAll() {
    if (!window.confirm("This will sign out every user in this organization. Continue?")) return;
    try {
      const response = await userManagementService.checkoutAll();
      setNotice(`${formatNumber(response.data.loggedOut)} sessions signed out.`);
      await refreshData(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not sign out users.");
    }
  }

  async function unlockAll() {
    try {
      const response = await userManagementService.unlockAll();
      setNotice(`${formatNumber(response.data.unlocked)} accounts unlocked.`);
      await refreshData(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not unlock accounts.");
    }
  }

  const stats = overview?.stats;
  const kpis = [
    ["Total users", stats?.totalUsers ?? 0],
    ["Active Users", stats?.activeUsers ?? 0],
    ["Inactive / Disabled", stats?.inactiveDisabled ?? 0],
    ["Online now", stats?.onlineNow ?? 0],
    ["New this week", stats?.newThisWeek ?? 0],
    ["New this month", stats?.newThisMonth ?? 0],
    ["Logins today", stats?.loginsToday ?? 0],
    ["Never logged in", stats?.neverLoggedIn ?? 0],
    ["ASRs (Field)", stats?.asrs ?? 0],
    ["ASRs with Transport", stats?.asrsWithTransport ?? 0],
    ["TSMs", stats?.tsms ?? 0],
    ["Distributors", stats?.distributors ?? 0],
    ["Admins & RSM", stats?.adminsAndRsms ?? 0],
    ["Logins this week", stats?.loginsThisWeek ?? 0],
    ["Suspended", stats?.suspended ?? 0],
    ["Incomplete profiles", stats?.incompleteProfiles ?? 0],
  ] as const;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Users Overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatNumber(stats?.totalUsers ?? 0)} users
                <span className="mx-2 text-border">|</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />{formatNumber(stats?.onlineNow ?? 0)} online now</span>
                <span className="mx-2 text-border">|</span>
                Updated {overview?.updatedAt ? formatDateTime(overview.updatedAt) : "--"}
              </p>
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Refresh user data" title="Refresh" onClick={() => void refreshData()} disabled={refreshing}>
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </header>

          {loading && <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading users...</div>}
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

          <section aria-label="User KPIs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {kpis.map(([label, value]) => (
              <Card key={label} className="min-w-0">
                <CardContent className="p-4">
                  <p className="truncate text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(value)}</p>
                  {label === "Online now" && <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />Live presence</span>}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>New signups - last 30 days</CardTitle><p className="text-sm text-muted-foreground">Daily new user registrations</p></CardHeader>
              <CardContent>{overview && <LineChart data={overview.signups} />}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Most Active Users - this week</CardTitle><p className="text-sm text-muted-foreground">Top 8 by login count (Mon - now)</p></CardHeader>
              <CardContent>{overview && <Bars data={overview.topActiveUsers} />}</CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Shift Time Manager</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">ASR business day window</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShiftOpen(true)}><Pencil className="size-4" />Edit</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                The ASR business day is closed from {overview?.shift.closeStart ?? "23:00"} to {overview?.shift.closeEnd ?? "05:30"} EAT. Sales, check-ins, outlet creation, and orders reopen automatically at {overview?.shift.reopenAt ?? "06:00"}.
              </p>
              <p className="text-xs text-muted-foreground">The configured window is stored for this organization. Enforcement will take effect when the sales, check-in, and outlet workflows are connected.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Closed</p>
                  <p className="mt-1 text-lg font-semibold">{overview?.shift.closeStart ?? "23:00"} - {overview?.shift.closeEnd ?? "05:30"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Reopen</p>
                  <p className="mt-1 text-lg font-semibold">{overview?.shift.reopenAt ?? "06:00"}</p>
                </div>
              </div>
              <p className="border-t pt-3 text-xs text-muted-foreground">
                {overview?.shift.updatedBy
                  ? `Last updated by ${overview.shift.updatedBy} at ${formatDateTime(overview.shift.updatedAt)} EAT`
                  : "Default schedule; no admin edits yet."}
              </p>
            </CardContent>
          </Card>

          <section aria-labelledby="user-management-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="user-management-title" className="text-xl font-semibold">User management</h2>
              <Button type="button" onClick={() => setCreateOpen(true)}><Plus className="size-4" />Add User</Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                {userFilters.map((item) => (
                  <Button key={item.value} type="button" size="sm" variant={filter === item.value ? "default" : "ghost"} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</Button>
                ))}
              </div>
              <Button type="button" size="sm" variant={liveGraph ? "default" : "outline"} aria-pressed={liveGraph} onClick={() => setLiveGraph((current) => !current)}><Activity className="size-4" />Live graph</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void checkoutAll()}><LogOut className="size-4" />Checkout all</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void unlockAll()}><Unlock className="size-4" />Unlock users</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => void logout()}><LogOut className="size-4" />Logout</Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, phone, or role" className="h-9 pl-9" />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDownWideNarrow className="size-4" />Sort by
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                  <option value="date">Registration date</option><option value="name">Name</option><option value="role">Role</option><option value="department">Department</option><option value="logins">Logins this week</option>
                </select>
              </label>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {filter === "login-attempts" ? (
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="border-b bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Result</th><th className="px-4 py-3 font-medium">Time</th></tr></thead>
                      <tbody>{overview?.loginAttempts.map((attempt, index) => <tr key={`${attempt.userId}-${attempt.createdAt}-${index}`} className="border-b last:border-0"><td className="px-4 py-3">{attempt.name}</td><td className="px-4 py-3">{attempt.successful ? "Successful" : "Failed"}</td><td className="px-4 py-3 text-muted-foreground">{formatDateTime(attempt.createdAt)}</td></tr>)}</tbody>
                    </table>
                  ) : (
                    <table className="w-full min-w-[1120px] text-left text-sm">
                      <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <tr>{["Name", "Email", "Phone", "Reg. Date", "Role", "Department", "Status", "App access", "Online", "Action"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map((user) => (
                          <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-3 py-3"><div className="flex items-center gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="font-medium">{user.name}</span>{user.incomplete && <span title="Profile incomplete" className="size-1.5 rounded-full bg-amber-500" />}</div></td>
                            <td className="px-3 py-3 text-muted-foreground">{user.email}</td>
                            <td className="px-3 py-3 text-muted-foreground">{user.phone ?? "--"}</td>
                            <td className="px-3 py-3 text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                            <td className="px-3 py-3">{user.roles.join(", ") || "Unassigned"}</td>
                            <td className="px-3 py-3 text-muted-foreground">{user.department || "--"}</td>
                            <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 ${user.status === "ACTIVE" ? "text-emerald-600" : "text-muted-foreground"}`}><span className={`size-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground"}`} />{user.status === "ACTIVE" ? "Active" : "Inactive"}{user.locked && " - Locked"}</span></td>
                            <td className="px-3 py-3">{user.appAccess ? <span className="text-emerald-600">Active</span> : <span className="text-muted-foreground">No Access</span>}</td>
                            <td className="px-3 py-3">{user.online ? <span className="inline-flex items-center gap-1 text-emerald-600" title="Online"><Wifi className="size-4" /><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /></span> : <WifiOff className="size-4 text-muted-foreground" aria-label="Offline" />}</td>
                            <td className="px-3 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}><MoreHorizontal /></Button>} />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingUser(user)}><Pencil />Edit profile</DropdownMenuItem>
                                  {user.status === "ACTIVE" ? <DropdownMenuItem onClick={() => void runUserAction(user, "disable")}>Disable user</DropdownMenuItem> : <DropdownMenuItem onClick={() => void runUserAction(user, "activate")}>Activate user</DropdownMenuItem>}
                                  {!user.locked ? <DropdownMenuItem onClick={() => void runUserAction(user, "suspend")}>Suspend user</DropdownMenuItem> : <DropdownMenuItem onClick={() => void runUserAction(user, "unlock")}>Unlock account</DropdownMenuItem>}
                                  {user.online && <DropdownMenuItem onClick={() => void runUserAction(user, "checkout")}>Log out user</DropdownMenuItem>}
                                  {user.status !== "ARCHIVED" && <DropdownMenuItem variant="destructive" onClick={() => void runUserAction(user, "archive")}>Archive user</DropdownMenuItem>}
                                  {user.hasNationalIdFront && <DropdownMenuItem onClick={() => window.open(userManagementService.identityDocumentUrl(user.id, "front"), "_blank", "noopener,noreferrer")}><FileImage />View ID front</DropdownMenuItem>}
                                  {user.hasNationalIdBack && <DropdownMenuItem onClick={() => window.open(userManagementService.identityDocumentUrl(user.id, "back"), "_blank", "noopener,noreferrer")}><FileImage />View ID back</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {!loading && filter !== "login-attempts" && visibleUsers.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No users match these filters.</p>}
              </CardContent>
            </Card>
          </section>
        </div>
      </PageContainer>

      {createOpen && overview && <UserCreateDialog overview={overview} onClose={() => setCreateOpen(false)} onCreated={async (department) => {
        if (department) setOverview((current) => current ? { ...current, departments: [...current.departments.filter((item) => item.id !== department.id), department] } : current);
        else await refreshData(false);
      }} />}
      {editingUser && overview && <UserEditDialog user={editingUser} overview={overview} onClose={() => setEditingUser(null)} onSaved={() => refreshData(false)} />}
      {shiftOpen && overview && <ShiftEditor overview={overview} onClose={() => setShiftOpen(false)} onSaved={() => refreshData(false)} />}
    </AppShell>
  );
}
