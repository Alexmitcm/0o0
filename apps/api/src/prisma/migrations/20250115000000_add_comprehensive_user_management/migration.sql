-- CreateEnum
CREATE TYPE "PremiumStatus" AS ENUM ('Standard', 'OnChainUnlinked', 'ProLinked');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('Public', 'Private', 'FriendsOnly');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('Referral', 'Quest', 'Activity', 'Bonus', 'Welcome');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('Pending', 'Claimed', 'Failed', 'Expired');

-- CreateEnum
CREATE TYPE "RewardSourceType" AS ENUM ('Registration', 'Referral', 'Quest', 'Activity', 'Admin');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('Welcome', 'Referral', 'Activity', 'Social', 'Premium');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('Active', 'Completed', 'Expired', 'Failed');

-- CreateEnum
CREATE TYPE "CoinType" AS ENUM ('Experience', 'Achievement', 'Social', 'Premium');

-- CreateEnum
CREATE TYPE "CoinSourceType" AS ENUM ('Registration', 'Referral', 'Quest', 'Activity', 'Social');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('Welcome', 'Premium', 'Quest', 'Reward', 'Referral', 'System', 'Marketing');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('Low', 'Normal', 'High', 'Urgent');

-- CreateTable
CREATE TABLE "User" (
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "twitterHandle" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerAddress" TEXT,
    "registrationTxHash" TEXT,
    "premiumStatus" "PremiumStatus" NOT NULL DEFAULT 'Standard',
    "premiumUpgradedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLogins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "walletAddress" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'Public',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "autoLinkProfile" BOOLEAN NOT NULL DEFAULT true,
    "showPremiumBadge" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "walletAddress" TEXT NOT NULL,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "totalFollowing" INTEGER NOT NULL DEFAULT 0,
    "daysAsPremium" INTEGER NOT NULL DEFAULT 0,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "questsCompleted" INTEGER NOT NULL DEFAULT 0,
    "questsInProgress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "status" "RewardStatus" NOT NULL DEFAULT 'Pending',
    "sourceType" "RewardSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceMetadata" JSONB,
    "txHash" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuest" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'Active',
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "targetProgress" INTEGER NOT NULL,
    "rewardAmount" DECIMAL(20,8),
    "rewardCurrency" TEXT NOT NULL DEFAULT 'USDT',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoin" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "coinType" "CoinType" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" "CoinSourceType" NOT NULL,
    "sourceId" TEXT,
    "sourceMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'Normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "actionMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_premiumStatus_idx" ON "User"("premiumStatus");

-- CreateIndex
CREATE INDEX "User_registrationDate_idx" ON "User"("registrationDate");

-- CreateIndex
CREATE INDEX "UserReward_walletAddress_idx" ON "UserReward"("walletAddress");

-- CreateIndex
CREATE INDEX "UserReward_type_idx" ON "UserReward"("type");

-- CreateIndex
CREATE INDEX "UserReward_status_idx" ON "UserReward"("status");

-- CreateIndex
CREATE INDEX "UserReward_createdAt_idx" ON "UserReward"("createdAt");

-- CreateIndex
CREATE INDEX "UserQuest_walletAddress_idx" ON "UserQuest"("walletAddress");

-- CreateIndex
CREATE INDEX "UserQuest_questId_idx" ON "UserQuest"("questId");

-- CreateIndex
CREATE INDEX "UserQuest_status_idx" ON "UserQuest"("status");

-- CreateIndex
CREATE INDEX "UserQuest_createdAt_idx" ON "UserQuest"("createdAt");

-- CreateIndex
CREATE INDEX "UserCoin_walletAddress_idx" ON "UserCoin"("walletAddress");

-- CreateIndex
CREATE INDEX "UserCoin_coinType_idx" ON "UserCoin"("coinType");

-- CreateIndex
CREATE INDEX "UserCoin_earnedAt_idx" ON "UserCoin"("earnedAt");

-- CreateIndex
CREATE INDEX "UserNotification_walletAddress_idx" ON "UserNotification"("walletAddress");

-- CreateIndex
CREATE INDEX "UserNotification_type_idx" ON "UserNotification"("type");

-- CreateIndex
CREATE INDEX "UserNotification_isRead_idx" ON "UserNotification"("isRead");

-- CreateIndex
CREATE INDEX "UserNotification_createdAt_idx" ON "UserNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoin" ADD CONSTRAINT "UserCoin_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE; 