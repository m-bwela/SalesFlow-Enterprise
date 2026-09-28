import { AdminTablePage } from "./AdminTablePage";

const rows = [
  { Level: "Region", Name: "Coast", Manager: "Regional Sales Manager", Teams: 6, Status: "Active" },
  { Level: "Region", Name: "Central", Manager: "Regional Sales Manager", Teams: 5, Status: "Active" },
  { Level: "Region", Name: "Western", Manager: "Regional Sales Manager", Teams: 4, Status: "Active" },
  { Level: "Territory", Name: "Nairobi South", Manager: "TSM", Teams: 2, Status: "Active" },
];

export function OrganizationStructurePage() {
  return (
    <AdminTablePage
      title="Organization Structure"
      description="View the core hierarchy of regions, territories, and leadership ownership."
      columns={["Level", "Name", "Manager", "Teams", "Status"]}
      rows={rows}
    />
  );
}
