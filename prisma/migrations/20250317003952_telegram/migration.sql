-- CreateTable
CREATE TABLE "TelegramConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "telegramConfigId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "walletAddress" TEXT,
    "tokenAddress" TEXT,
    "threshold" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConfig_userId_key" ON "TelegramConfig"("userId");

-- CreateIndex
CREATE INDEX "Alert_telegramConfigId_idx" ON "Alert"("telegramConfigId");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_walletAddress_idx" ON "Alert"("walletAddress");

-- AddForeignKey
ALTER TABLE "TelegramConfig" ADD CONSTRAINT "TelegramConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_telegramConfigId_fkey" FOREIGN KEY ("telegramConfigId") REFERENCES "TelegramConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
