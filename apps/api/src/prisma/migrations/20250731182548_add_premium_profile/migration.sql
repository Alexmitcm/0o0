-- CreateTable
CREATE TABLE "PremiumProfile" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "PremiumProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PremiumProfile_walletAddress_key" ON "PremiumProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PremiumProfile_profileId_key" ON "PremiumProfile"("profileId");

-- CreateIndex
CREATE INDEX "PremiumProfile_walletAddress_idx" ON "PremiumProfile"("walletAddress");

-- CreateIndex
CREATE INDEX "PremiumProfile_profileId_idx" ON "PremiumProfile"("profileId");
