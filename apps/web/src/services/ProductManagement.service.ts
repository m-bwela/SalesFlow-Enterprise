import { apiFetch } from "@/lib/api";

export interface ProductRow {
    id: string;
    name: string;
    sku: string;
    brand: string | null;
    category: string | null;
    packSize: string | null;
    price: number;
    isActive: boolean;
}

export interface ProductsOverview {
    updatedAt: string;
    stats: {
        total: number;
        active: number;
        inactive: number;
        brands: number;
        categories: number;
        avgPrice: number;
    };
    byCategory: Array<{
        name: string;
        count: number;
    }>;
    byBrand: Array<{
        name: string;
        count: number;
    }>;
    priceBuckets: Array<{
        label: string;
        count: number;
    }>;
    topSelling: Array<{
        id: string;
        name: string;
        revenue: number;
        units: number;
    }>;
    revenueByCategory: Array<{
        name: string;
        revenue: number;
    }>;
    revenue30d: number;
    products: ProductRow[];
    categories: string[];
    brandList: string[];
}

export interface ProductInput {
    name: string;
    sku: string;
    brand: string;
    category: string;
    packSize: string;
    unitPrice: number;
    isActive: boolean;
}

export const productManagementService = {
    async getOverview() {
        return (
            await apiFetch<{
                data: ProductsOverview
            }>
            ("/api/v1/products")
        ).data;
    },
    create: (p: ProductInput) =>
        apiFetch("/api/v1/products", {
            method: "POST",
            body: JSON.stringify(p)
        }),
    update: (id: string, p: ProductInput) =>
        apiFetch(`/api/v1/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(p)
        }),
    setStatus: (id: string, isActive: boolean) =>
        apiFetch(`/api/v1/products/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isActive })
        }),
    remove: (id: string) =>
        apiFetch(`/api/v1/products/${id}`, {
            method: "DELETE"
        }),

};