import { apiFetch } from "@/lib/api";
import type { OrganizationRegion } from "@/types/organization";

export async function getOrganizationFilters() {
    const response = await apiFetch<{data: OrganizationRegion[]}>
    ("/api/v1/organization/filters");

    return response.data;
}