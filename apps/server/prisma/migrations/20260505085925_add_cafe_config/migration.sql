-- CreateTable
CREATE TABLE "CafeConfig" (
    "id" TEXT NOT NULL,
    "cafeName" TEXT NOT NULL,
    "cafeNameAmharic" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#120B05',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "currencySymbol" TEXT NOT NULL DEFAULT 'ብር',
    "enableTelebirr" BOOLEAN NOT NULL DEFAULT true,
    "enableCbeBirr" BOOLEAN NOT NULL DEFAULT true,
    "enableCash" BOOLEAN NOT NULL DEFAULT true,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'EN',
    "receiptHeader" TEXT NOT NULL,
    "receiptFooter" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CafeConfig_pkey" PRIMARY KEY ("id")
);
