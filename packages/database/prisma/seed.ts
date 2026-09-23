/// <reference types="node" />
import { PrismaClient, ScopeType } from '@prisma/client';
import * as argon2 from "argon2";

const prisma = new PrismaClient();

enum RoleCode {
    ADMIN = 'ADMIN',
    RSM = 'RSM',
    GT_TSM = 'GT_TSM',
    MT_TSM = 'MT_TSM',
    MTSR = 'MTSR',
    ASR = 'ASR',
}

const roles = [
    {
        code: RoleCode.ADMIN,
        name: 'Admin',
        description: 'System-wide administration and configuration'
    },
    {
        code: RoleCode.RSM,
        name: 'Regional Sales Manager',
        description: 'Manages regional sales performance and territory operations',
    },
    {
        code: RoleCode.GT_TSM,
        name: 'General Trade Territory Sales Manager',
        description: 'Manages General Trade performance within a territory',
    },
    {
        code: RoleCode.MT_TSM,
        name: 'Modern Trade Territory Sales Manager',
        description: 'Manages Modern Trade performance within a Region',
    },
    {
        code: RoleCode.MTSR,
        name: 'Modern Trade Sales Representative',
        description: 'Handles Modern Trade sales activities within an assigned territory',
    },
    {
        code: RoleCode.ASR,
        name: 'Area Sales Representative',
        description: 'Executes field sales activities within an assigned distributor scope',
    },
];

const permissions = [
    ["dashboard.view", "View dashboard"],
    ["users.view", "View users"],
    ["users.create", "Create users"],
    ["users.update", "Update users"],
    ["users.disable", "Disable users"],

    ["organization.view", "View organization"],
    ["organization.manage", "Manage organization"],

    ["outlets.view", "View Outlets"],
    ["outlets.create", "Create Outlets"],
    ["outlets.update", "Update Outlets"],
    
    ["sales.view", "View sales"],
    ["sales.create", "Create sales"],
    ["sales.update", "Update sales"],

    ["inventory.view", "View inventory"],
    ["inventory.manage", "Manage inventory"],

    ["reports.view", "View reports"],
    ["reports.export", "Export reports"],

    ["tasks.view", "View tasks"],
    ["tasks.manage", "Manage tasks"],

    ["leaves.view", "View leaves"],
    ["leaves.manage", "Manage leaves"],

    ["workflow.view", "View workflow"],
    ["workflow.approve", "Approve workflows"],

    ["audit.view", "View audit logs"],

    ["system.view", "View system configuration"],
    ["system.manage", "Manage system configuration"],
];

async function main() {
    console.log("Seeding SalesFlow Enterprise RBAC...");

    for (const role of roles) {
        await prisma.role.upsert({
            where: {
                code: role.code,
            },
            update: {
                name: role.name,
                description: role.description,
            },
            create: role,    
        });
    }

    for (const [code, name] of permissions) {
        await prisma.permission.upsert({
            where: {
                code,
            },
            update: {
                name,
            },
            create: {
                code,
                name,
            },
        });
    }

    /*
     * Initial permission policy
     *
     * We deliberately keep this explicit rather than giving every
     * role unrestricted access.
     */

    const rolePermissionMap: Record<RoleCode, string[]> = {
        [RoleCode.ADMIN]:
        permissions.map(([code]) => code),

        [RoleCode.RSM]: [
            "dashboard.view",
            "organization.view",
            "outlets.view",
            "sales.view",
            "inventory.view",
            "reports.view",
            "reports.export",
            "tasks.view",
            "tasks.manage",
            "leaves.view",
            "leaves.manage",
            "workflow.view",
            "workflow.approve",
        ],

        [RoleCode.GT_TSM]: [
            "dashboard.view",
            "organization.view",
            "outlets.view",
            "outlets.create",
            "outlets.update",
            "sales.view",
            "inventory.view",
            "reports.view",
            "reports.export",
            "tasks.view",
            "tasks.manage",
            "leaves.view",
            "leaves.manage",
            "workflow.view",
            "workflow.approve",
        ],

        [RoleCode.MT_TSM]: [
            "dashboard.view",
            "organization.view",
            "outlets.view",
            "outlets.create",
            "outlets.update",
            "sales.view",
            "inventory.view",
            "reports.view",
            "reports.export",
            "tasks.view",
            "tasks.manage",
            "leaves.view",
            "leaves.manage",
            "workflow.view",
            "workflow.approve",
        ],

        [RoleCode.MTSR]: [
            "dashboard.view",
            "organization.view",
            "outlets.view",
            "outlets.create",
            "outlets.update",
            "sales.view",
            "sales.create",
            "sales.update",
            "inventory.view",
            "reports.view",
            "tasks.view",
            "tasks.manage",
            "leaves.view",
            "workflow.view",
        ],

        [RoleCode.ASR]: [
            "dashboard.view",
            "organization.view",
            "outlets.view",
            "outlets.create",
            "outlets.update",
            "sales.view",
            "sales.create",
            "sales.update",
            "inventory.view",
            "reports.view",
            "tasks.view",
            "tasks.manage",
            "leaves.view",
            "workflow.view",
        ],
    };

    for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMap)) {
        // Seed logic for each role and its permissions goes here
        const role = await prisma.role.findUnique({
            where: {
                code: roleCode as RoleCode,
            },
        });

        if (!role) {
            throw new Error(`Role not found: ${roleCode}`);
        }

        for (const permissionCode of permissionCodes) {
            const permission = await prisma.permission.findUnique({
                where: {
                    code: permissionCode,
                },
            });

            if (!permission) {
                throw new Error(`Permission not found: ${permissionCode}`);
            }

            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            });
        }
    }

    console.log("Seeding completed successfully.");


    // Development organization hierarchy

    const organization = await prisma.organization.upsert({
        where: {
            code: "SFE",
        },
        update: {
            name: "SalesFlow Enterprise",
            isActive: true,
        },
        create: {
            code: "SFE",
            name: "SalesFlow Enterprise",
        }
    });

    const region = await prisma.region.upsert({
        where: {
            organizationId_code: {
                organizationId: organization.id,
                code: "COAST",
            }
        },
        update: {
            name: "Coast Region",
            isActive: true,
        },
        create: {
            organizationId: organization.id,
            code: "COAST",
            name: "Coast Region",
        }
    });

    const territory = await prisma.territory.upsert({
        where: {
            regionId_code: {
                regionId: region.id,
                code: "MOMBASA"
            }
        },
        update: {
            name: "Mombasa Territory",
            isActive: true,
        },
        create: {
            regionId: region.id,
            code: "MOMBASA",
            name: "Mombasa Territory",
        }
    });

    const distributor = await prisma.distributor.upsert({
        where: {
            territoryId_code: {
                territoryId: territory.id,
                code: "MOMBASA-DIST",
            }
        },
        update: {
            name: "Mombasa Distributor",
            isActive: true,
        },
        create: {
            territoryId: territory.id,
            code: "MOMBASA-DIST",
            name: "Mombasa Distributor",
        }
    });

    const warehouse = await prisma.warehouse.upsert({
        where: {
            distributorId_code: {
                distributorId: distributor.id,
                code: "MOMBASA-WH",
            }
        },
        update: {
            name: "Mombasa Main Warehouse",
            isActive: true,
        },
        create: {
            distributorId: distributor.id,
            code: "MOMBASA-WH",
            name: "Mombasa Main Warehouse",
        }
    });

    console.log("Development organization hierarchy seeded successfully.");


    const johnPasswordHash = await argon2.hash("ChangeMe123!",
        {
            type: argon2.argon2id,
        },
    );

    const john = await prisma.user.upsert({
        where: {
            email: "john@salesflow.local",
        },
        update: {
            displayName: "John",
            status: "ACTIVE",
        },
        create: {
            email: "john@salesflow.local",
            passwordHash: johnPasswordHash,
            displayName: "John",
            status: "ACTIVE",
        },
    });

    const johnMembership = await prisma.membership.upsert({
        where: {
            userId_organizationId: {
                userId: john.id,
                organizationId: organization.id,
            }
        },
        update: {
            isActive: true,
        },
        create: {
            userId: john.id,
            organizationId: organization.id,
            isActive: true,
        }
    });
    
    const asrRole = await prisma.role.findUnique({
        where: {
            code: RoleCode.ASR,
        },
    });

    if (!asrRole) {
        throw new Error("ASR role not found.");
    }

    const existingJohnRole = await prisma.membershipRole.findFirst({
        where: {
            membershipId: johnMembership.id,
            roleId: asrRole.id,
            scopeType: ScopeType.DISTRIBUTOR,
            distributorId: distributor.id,
            isActive: true,
        },
    });

    if (!existingJohnRole) {
        await prisma.membershipRole.create({
            data: {
                membershipId: johnMembership.id,
                roleId: asrRole.id,
                scopeType: ScopeType.DISTRIBUTOR,
                distributorId: distributor.id,
                isActive: true,
            },
        });
    }

    console.log(`John seeded as ASR for distributor ${distributor.name}.`);


    const adminPasswordHash = await argon2.hash("AdminChangeMe123!", {
        type: argon2.argon2id,
    });

    const adminUser = await prisma.user.upsert({
        where: {
            email: "admin@salesflow.local",
        },
        update: {
            displayName: "SalesFlow Admin",
            passwordHash: adminPasswordHash,
            status: "ACTIVE",
        },
        create: {
            email: "admin@salesflow.local",
            displayName: "SalesFlow Admin",
            passwordHash: adminPasswordHash,
            status: "ACTIVE",
        },
    });

    const adminMembership = await prisma.membership.upsert({
        where: {
            userId_organizationId: {
                userId: adminUser.id,
                organizationId: organization.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            organizationId: organization.id,
            isActive: true,
        },
    });

    const adminRole = await prisma.role.findUniqueOrThrow({
        where: {
            code: "ADMIN",
        },
    });

    await prisma.membershipRole.upsert({
        where: {
            membershipId_roleId: {
                membershipId: adminMembership.id,
                roleId: adminRole.id,
            },
        },
        update: {
            scopeType: ScopeType.GLOBAL,
            isActive: true,
            endsAt: null,
        },
        create: {
            membershipId: adminMembership.id,
            roleId: adminRole.id,
            scopeType: ScopeType.GLOBAL,
            isActive: true,
        },
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
})