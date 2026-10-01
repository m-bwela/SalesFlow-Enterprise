INSERT INTO "roles" ("id", "code", "name", "description", "isSystem", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'SUPER_ADMIN', 'Super Admin', 'Full system administration and role assignment', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'DISTRIBUTOR', 'Distributor', 'Manages distributor operations within an assigned distributor scope', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'HORECA', 'Horeca', 'Executes hospitality-channel sales within an assigned distributor scope', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SUPPORT', 'Support', 'Provides read-only operational support', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'SUPER_ADMIN'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
    'dashboard.view', 'organization.view', 'outlets.view', 'sales.view', 'inventory.view', 'reports.view'
)
WHERE r."code" = 'DISTRIBUTOR'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
    'dashboard.view', 'organization.view', 'outlets.view', 'sales.view', 'sales.create', 'sales.update', 'reports.view'
)
WHERE r."code" = 'HORECA'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN ('dashboard.view', 'users.view', 'audit.view')
WHERE r."code" = 'SUPPORT'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "membership_roles" (
    "id", "membershipId", "roleId", "scopeType", "startsAt", "isActive", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), m."id", r."id", 'GLOBAL', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
JOIN "memberships" m ON m."userId" = u."id" AND m."isActive" = true
JOIN "roles" r ON r."code" = 'SUPER_ADMIN'
WHERE u."email" = 'admin@salesflow.local'
ON CONFLICT ("membershipId", "roleId") DO UPDATE
SET "scopeType" = 'GLOBAL', "isActive" = true, "endsAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "departments" ("id", "organizationId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid(), o."id", d."name", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" o
CROSS JOIN (VALUES
    ('Administration'), ('IT'), ('Accounts'), ('Marketing'), ('Operations'), ('Sales'), ('Support')
) AS d("name")
WHERE o."code" = 'SFE'
ON CONFLICT ("organizationId", "name") DO NOTHING;