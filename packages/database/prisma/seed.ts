/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

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
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
})