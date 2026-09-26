import { apiFetch } from "@/lib/api";
import type { OrganizationFilters } from "@/types/organization";

export async function getOrganizationFilters() {
  const response = await apiFetch<{
    data: OrganizationFilters;
  }>("/api/v1/organization/filters");

  return response.data;
}