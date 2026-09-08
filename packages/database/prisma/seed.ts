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

    
]