-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "impersonatedById" UUID;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonatedById_fkey" FOREIGN KEY ("impersonatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
