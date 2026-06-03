-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);
