import { prisma, Prisma } from '@salesflow/database';

const tally = (items: string[]) => {
    const m = new Map<string, number>();
    items.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
    return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

const BUCKETS: [string, number, number][] = [
    ["< 100", 0, 100], ["100 - 249", 100, 250], ["250 - 499", 250, 500],
    ["500 - 999", 500, 1000], ["1000 - 1999", 1000, 2000], ["2000+", 2000, Infinity],
];

export async function getProductsOverview(organizationId: string) {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [rows, top, revCat] = await Promise.all([
        prisma.product.findMany({
            where: {
                organizationId
            },
            orderBy: {
                name: 'asc'
            }
        }),

        prisma.$queryRaw<{ id: string; name: string; revenue: number; units: number }[]>(Prisma.sql`
            SELECT p.id, p.name, SUM(i.quantity * i."unitPrice")::float AS revenue, SUM(i.quantity)::float AS units
            FROM sales_order_items i
            JOIN sales_orders so ON so.id = i."salesOrderId" AND so.status <> 'CANCELLED'
            AND so."organizationId" = ${organizationId}::uuid AND so."orderDate" >= ${since}
            JOIN products p ON p.id = i."productId"
            GROUP BY p.id, p.name ORDER BY revenue DESC`),
        prisma.$queryRaw<{ name: string; revenue: number }[]>(Prisma.sql`
            SELECT COALESCE(p.category, 'Uncategorized') AS name, SUM(i.quantity * i."unitPrice")::float AS revenue
            FROM sales_order_items i
            JOIN sales_orders so ON so.id = i."salesOrderId" AND so.status <> 'CANCELLED'
            AND so."organizationId" = ${organizationId}::UUID and SO."orderDate" >= ${since}
            JOIN products p ON p.id = i."productId"
            GROUP BY 1 ORDER BY revenue DESC`),
    ]);

    const products = rows.map((p) => ({
        id: p.id, name: p.name, sku: p.sku, brand: p.brand, category: p.category, packSize: p.packSize,
        price: Number(p.unitPrice), isActive: p.isActive
    }));
    const prices = products.map((p) => p.price);
    const brands = products.map((p) => p.brand).filter(Boolean) as string[];
    const categories = products.map((p) => p.category).filter(Boolean) as string[];

    return {
        updatedAt: new Date(),
        stats: {
            total: products.length,
            active: products.filter((p) => p.isActive).length,
            inactive: products.filter((p) => !p.isActive).length,
            brands: new Set(brands).size,
            categories: new Set(categories).size,
            avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        },
        byCategory: tally(products.map((p) => p.category ?? "Uncategorized")),
        byBrand: tally(products.map((p) => p.brand ?? "Unbranded")).slice(0, 10),
        priceBuckets: BUCKETS.map(([label, lo, hi]) => ({
            label,
            count: prices.filter((x) => x >= lo && x < hi).length,
        })),
        topSelling: top.slice(0, 8),
        revenueByCategory: revCat,
        revenue30d: top.reduce((s, r) => s + r.revenue, 0),
        products,
        categories: [...new Set(categories)].sort(),
        brandList: [...new Set(brands)].sort(),
    };
}