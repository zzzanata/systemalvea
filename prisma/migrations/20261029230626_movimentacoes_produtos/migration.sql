-- AlterTable
ALTER TABLE "FinanceEntry" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
ADD COLUMN     "unitValue" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceCategory_name_key" ON "FinanceCategory"("name");

-- CreateIndex
CREATE INDEX "FinanceEntry_categoryId_idx" ON "FinanceEntry"("categoryId");

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
