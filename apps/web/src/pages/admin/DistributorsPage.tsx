import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Name: "Mombasa Distributor", Code: "MSA-01", Territory: "Mombasa", Warehouses: 2, Status: "Active" },
  { Name: "Nairobi Distributor", Code: "NBO-01", Territory: "Nairobi", Warehouses: 3, Status: "Active" },
  { Name: "Kisumu Distributor", Code: "KSM-01", Territory: "Kisumu", Warehouses: 2, Status: "Active" },
];

export function DistributorsPage() {
  return (
    <AdminTablePage
      title="Distributors"
      description="Track distributor performance, coverage, and assigned warehouses."
      columns={["Name", "Code", "Territory", "Warehouses", "Status"]}
      rows={rows}
    />
  );
}
