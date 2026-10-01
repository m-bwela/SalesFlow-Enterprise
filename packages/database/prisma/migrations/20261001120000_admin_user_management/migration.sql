ALTER TYPE "UserStatus" ADD VALUE 'ARCHIVED';
ALTER TYPE "RoleCode" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "RoleCode" ADD VALUE 'DISTRIBUTOR';
ALTER TYPE "RoleCode" ADD VALUE 'HORECA';
ALTER TYPE "RoleCode" ADD VALUE 'SUPPORT';

ALTER TABLE "users"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "surname" TEXT,
ADD COLUMN "departmentId" UUID,
ADD COLUMN "transportType" TEXT,
ADD COLUMN "homeRegion" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "streetName" TEXT,
ADD COLUMN "blockNumber" TEXT,
ADD COLUMN "nationalIdFrontPath" TEXT,
ADD COLUMN "nationalIdBackPath" TEXT,
ADD COLUMN "lockedUntil" TIMESTAMP(3);

CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "email" TEXT NOT NULL,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asr_shift_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "closeStart" TEXT NOT NULL DEFAULT '23:00',
    "closeEnd" TEXT NOT NULL DEFAULT '05:30',
    "reopenAt" TEXT NOT NULL DEFAULT '06:00',
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "asr_shift_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_organizationId_name_key" ON "departments"("organizationId", "name");
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");
CREATE INDEX "login_attempts_userId_createdAt_idx" ON "login_attempts"("userId", "createdAt");
CREATE INDEX "login_attempts_email_createdAt_idx" ON "login_attempts"("email", "createdAt");
CREATE INDEX "login_attempts_successful_createdAt_idx" ON "login_attempts"("successful", "createdAt");
CREATE UNIQUE INDEX "asr_shift_settings_organizationId_key" ON "asr_shift_settings"("organizationId");
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
CREATE INDEX "users_lockedUntil_idx" ON "users"("lockedUntil");

ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asr_shift_settings" ADD CONSTRAINT "asr_shift_settings_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asr_shift_settings" ADD CONSTRAINT "asr_shift_settings_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;