-- Two new roles so Payment Method change notifications have real recipients to resolve against.
ALTER TYPE "RoleCode" ADD VALUE 'CFO';
ALTER TYPE "RoleCode" ADD VALUE 'FINANCE';

-- Fixed, hard-coded set of payment method codes admins can enable/configure (not free text).
CREATE TYPE "PaymentMethodCode" AS ENUM ('MPESA', 'CASH', 'BANK', 'CREDIT');

CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" "PaymentMethodCode" NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "availableForDistributors" BOOLEAN NOT NULL DEFAULT false,
    "availableForTsm" BOOLEAN NOT NULL DEFAULT false,
    "availableForAsr" BOOLEAN NOT NULL DEFAULT false,
    "supportsStk" BOOLEAN NOT NULL DEFAULT false,
    "supportsB2c" BOOLEAN NOT NULL DEFAULT false,
    "requiresReference" BOOLEAN NOT NULL DEFAULT false,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "supportsQr" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_methods_organizationId_code_key" ON "payment_methods"("organizationId", "code");
CREATE INDEX "payment_methods_organizationId_sortOrder_idx" ON "payment_methods"("organizationId", "sortOrder");

ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
