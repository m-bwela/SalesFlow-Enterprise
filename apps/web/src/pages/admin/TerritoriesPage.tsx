import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Name: "Mombasa", Code: "MSA", Region: "Coast", Distributors: 4, Status: "Active" },
  { Name: "Nairobi", Code: "NBO", Region: "Central", Distributors: 5, Status: "Active" },
  { Name: "Kisumu", Code: "KSM", Region: "Western", Distributors: 3, Status: "Active" },
];

export function TerritoriesPage() {
  return (
    <AdminTablePage
      title="Territories"
      description="Monitor and manage sales territories and their assigned distributors."
      columns={["Name", "Code", "Region", "Distributors", "Status"]}
      rows={rows}
    />
  );
}
