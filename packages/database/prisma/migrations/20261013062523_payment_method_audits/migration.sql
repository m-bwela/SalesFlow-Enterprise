-- DropIndex
DROP INDEX "outlets_type_idx";

-- DropIndex
DROP INDEX "sales_orders_paymentMethod_orderDate_idx";

-- CreateTable
CREATE TABLE "payment_method_audits" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "methodCode" "PaymentMethodCode" NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "actorId" UUID,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_method_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_method_audits_organizationId_methodCode_createdAt_idx" ON "payment_method_audits"("organizationId", "methodCode", "createdAt");

-- AddForeignKey
ALTER TABLE "payment_method_audits" ADD CONSTRAINT "payment_method_audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
