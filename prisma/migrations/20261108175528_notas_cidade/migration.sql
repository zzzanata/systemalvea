-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "city" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_city_idx" ON "Invoice"("city");
