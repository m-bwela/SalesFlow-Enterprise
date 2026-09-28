import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Role: "ADMIN", Description: "Full system access", Users: 1, Status: "Active" },
  { Role: "RSM", Description: "Regional oversight and approvals", Users: 2, Status: "Active" },
  { Role: "GT_TSM", Description: "General trade team supervision", Users: 4, Status: "Active" },
  { Role: "ASR", Description: "Field sales execution and visit tracking", Users: 12, Status: "Active" },
];

export function RoleManagementPage() {
  return (
    <AdminTablePage
      title="Role Management"
      description="Manage role definitions and permission groups across the organization."
      columns={["Role", "Description", "Users", "Status"]}
      rows={rows}
    />
  );
}
