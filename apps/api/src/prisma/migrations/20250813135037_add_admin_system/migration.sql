/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `GameCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SuperAdmin', 'SupportAgent', 'Auditor', 'Moderator');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('ForceUnlinkProfile', 'ForceLinkProfile', 'GrantPremium', 'RevokePremium', 'UpdateFeatureAccess', 'AddAdminNote', 'UpdateUserStatus', 'BlockUser', 'UnblockUser');

-- CreateEnum
CREATE TYPE "AdminActionStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Cancelled');

-- AlterTable
ALTER TABLE "GameCategory" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "_GameToGameCategory" ADD CONSTRAINT "_GameToGameCategory_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_GameToGameTag" ADD CONSTRAINT "_GameToGameTag_AB_pkey" PRIMARY KEY ("A", "B");

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'SupportAgent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetWallet" TEXT NOT NULL,
    "targetProfileId" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "AdminActionStatus" NOT NULL DEFAULT 'Pending',
    "result" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "standardAccess" BOOLEAN NOT NULL DEFAULT false,
    "premiumAccess" BOOLEAN NOT NULL DEFAULT true,
    "adminOverride" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureAccess" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeatureAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_walletAddress_key" ON "AdminUser"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AdminUser_walletAddress_idx" ON "AdminUser"("walletAddress");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");

-- CreateIndex
CREATE INDEX "AdminPermission_adminUserId_idx" ON "AdminPermission"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminPermission_permission_idx" ON "AdminPermission"("permission");

-- CreateIndex
CREATE INDEX "AdminAction_adminUserId_idx" ON "AdminAction"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminAction_actionType_idx" ON "AdminAction"("actionType");

-- CreateIndex
CREATE INDEX "AdminAction_targetWallet_idx" ON "AdminAction"("targetWallet");

-- CreateIndex
CREATE INDEX "AdminAction_status_idx" ON "AdminAction"("status");

-- CreateIndex
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNote_adminUserId_idx" ON "AdminNote"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminNote_walletAddress_idx" ON "AdminNote"("walletAddress");

-- CreateIndex
CREATE INDEX "AdminNote_createdAt_idx" ON "AdminNote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_featureId_key" ON "Feature"("featureId");

-- CreateIndex
CREATE INDEX "Feature_featureId_idx" ON "Feature"("featureId");

-- CreateIndex
CREATE INDEX "Feature_category_idx" ON "Feature"("category");

-- CreateIndex
CREATE INDEX "Feature_isActive_idx" ON "Feature"("isActive");

-- CreateIndex
CREATE INDEX "FeatureAccess_featureId_idx" ON "FeatureAccess"("featureId");

-- CreateIndex
CREATE INDEX "FeatureAccess_walletAddress_idx" ON "FeatureAccess"("walletAddress");

-- CreateIndex
CREATE INDEX "FeatureAccess_isActive_idx" ON "FeatureAccess"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GameCategory_slug_key" ON "GameCategory"("slug");

-- CreateIndex
CREATE INDEX "GameCategory_slug_idx" ON "GameCategory"("slug");

-- CreateIndex
CREATE INDEX "GameTag_name_idx" ON "GameTag"("name");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureAccess" ADD CONSTRAINT "FeatureAccess_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureAccess" ADD CONSTRAINT "FeatureAccess_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;
