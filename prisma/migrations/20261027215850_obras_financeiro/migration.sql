-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'DONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DOING', 'DONE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('LEAD', 'MEMBER');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('REVENUE', 'COST');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'ISSUED', 'CANCELED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "powerKwp" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "expectedEnd" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "position" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "jobTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "EntryType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "number" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_projectId_position_idx" ON "Task"("projectId", "position");

-- CreateIndex
CREATE INDEX "TeamMember_projectId_idx" ON "TeamMember"("projectId");

-- CreateIndex
CREATE INDEX "FinanceEntry_date_idx" ON "FinanceEntry"("date");

-- CreateIndex
CREATE INDEX "FinanceEntry_projectId_idx" ON "FinanceEntry"("projectId");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_projectId_idx" ON "Invoice"("projectId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
