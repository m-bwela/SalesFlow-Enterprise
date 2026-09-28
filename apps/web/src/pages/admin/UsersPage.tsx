import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Name: "SalesFlow Admin", Email: "admin@salesflow.local", Role: "ADMIN", Status: "Active" },
  { Name: "RSM Kenya", Email: "rsm@salesflow.local", Role: "RSM", Status: "Active" },
  { Name: "TSM Central", Email: "tsm@salesflow.local", Role: "GT_TSM", Status: "Active" },
];

export function UsersPage() {
  return (
    <AdminTablePage
      title="Users"
      description="Manage system users, their access, and role assignments."
      columns={["Name", "Email", "Role", "Status"]}
      rows={rows}
    />
  );
}
