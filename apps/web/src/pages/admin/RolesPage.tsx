import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Role: "ADMIN", Description: "Full system access", Users: 1, Status: "Active" },
  { Role: "RSM", Description: "Regional sales leadership", Users: 2, Status: "Active" },
  { Role: "GT_TSM", Description: "General trade team lead", Users: 4, Status: "Active" },
  { Role: "ASR", Description: "Account sales representative", Users: 12, Status: "Active" },
];

export function RolesPage() {
  return (
    <AdminTablePage
      title="Roles"
      description="Review system roles and their assigned responsibilities."
      columns={["Role", "Description", "Users", "Status"]}
      rows={rows}
    />
  );
}
