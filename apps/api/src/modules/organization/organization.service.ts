import { prisma } from "@salesflow/database";

export async function getOrganizationFilters(organizationId: string) {
    const regions = await prisma.region.findMany({
        where: {
            organizationId,
            isActive: true,
        },
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
            code: true,
            territories: {
                where: {
                    isActive: true,
                },
                orderBy: {
                    name: "asc",
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    distributors: {
                        where: {
                            isActive: true,
                        },
                        orderBy: {
                            name: "asc",
                        },
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            },
        },
    });

    return regions;
}