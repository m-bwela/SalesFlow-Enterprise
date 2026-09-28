import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Name: "Coast", Code: "COAST", Territories: 5, Status: "Active" },
  { Name: "Central", Code: "CENTRAL", Territories: 4, Status: "Active" },
  { Name: "Western", Code: "WESTERN", Territories: 3, Status: "Active" },
];

export function RegionsPage() {
  return (
    <AdminTablePage
      title="Regions"
      description="Manage operational regions across the organization."
      columns={["Name", "Code", "Territories", "Status"]}
      rows={rows}
    />
  );
}
