import { prisma } from "@salesflow/database";
import { ScopeType } from "@prisma/client";

export async function validateScope(
    organizationId: string,
    scopeType: ScopeType,
    scopeId: string,
) {
    if (scopeType === ScopeType.GLOBAL) {
        return;
    }

    if (!scopeId) {
        throw new Error(`A ${scopeType} scope requires a scope ID.`);
    }

    switch (scopeType) {
        case ScopeType.REGION: {
            const region = await prisma.region.findFirst({
                where: {
                    id: scopeId,
                    organizationId,
                    isActive: true,
                },
            });

            if (!region) {
                throw new Error("Invalid region scope.");
            }

            return;
        }

        case ScopeType.TERRITORY: {
            const territory = await prisma.territory.findFirst({
                where: {
                    id: scopeId,
                    region: {
                        organizationId,
                    },
                    isActive: true,
                },
            });

            if (!territory) {
                throw new Error("Invalid territory scope.");
            }

            return;
        }

        case ScopeType.DISTRIBUTOR: {
            const distributor = await prisma.distributor.findFirst({
                where: {
                    id: scopeId,
                    territory: {
                        region: {
                            organizationId,
                        },
                    },
                    isActive: true,
                },
            });

            if (!distributor) {
                throw new Error("Invalid distributor scope.");
            }

            return;
        }

        case ScopeType.WAREHOUSE: {
            const warehouse = await prisma.warehouse.findFirst({
                where: {
                    id: scopeId,
                    distributor: {
                        territory: {
                            region: {
                                organizationId,
                            },
                        },
                    },
                    isActive: true,
                },
            });

            if (!warehouse) {
                throw new Error("Invalid warehouse scope.");
            }

            return;
        }
    
        default:
            throw new Error(`Unsupported scope type: ${scopeType}`);
    }
}