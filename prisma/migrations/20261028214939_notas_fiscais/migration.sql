/*
  Warnings:

  - A unique constraint covering the columns `[accessKey]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('IN', 'OUT');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "accessKey" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "recipientCnpj" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "senderCnpj" TEXT,
ADD COLUMN     "senderName" TEXT,
ADD COLUMN     "type" "InvoiceType" NOT NULL DEFAULT 'OUT';

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_accessKey_key" ON "Invoice"("accessKey");

-- CreateIndex
CREATE INDEX "Invoice_type_idx" ON "Invoice"("type");
