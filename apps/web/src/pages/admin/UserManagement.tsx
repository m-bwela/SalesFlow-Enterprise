import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Name: "SalesFlow Admin", Email: "admin@salesflow.local", Role: "ADMIN", Status: "Active" },
  { Name: "Kenya RSM", Email: "rsm@salesflow.local", Role: "RSM", Status: "Active" },
  { Name: "Nairobi TSM", Email: "tsm.nairobi@salesflow.local", Role: "GT_TSM", Status: "Active" },
  { Name: "Coast ASR", Email: "asr.coast@salesflow.local", Role: "ASR", Status: "Active" },
];

export function UserManagementPage() {
  return (
    <AdminTablePage
      title="User Management"
      description="Review users, access rights, and their current role assignments."
      columns={["Name", "Email", "Role", "Status"]}
      rows={rows}
    />
  );
}
