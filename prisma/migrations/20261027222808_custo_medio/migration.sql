-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "unitCost" DECIMAL(14,4);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "StockMovement_supplierId_idx" ON "StockMovement"("supplierId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
