-- Composite indexes aligned with Prisma schema additions

-- PremiumProfile
CREATE INDEX IF NOT EXISTS "PremiumProfile_walletAddress_isActive_idx" ON "PremiumProfile"("walletAddress", "isActive");
CREATE INDEX IF NOT EXISTS "PremiumProfile_profileId_isActive_idx" ON "PremiumProfile"("profileId", "isActive");

-- UserReward
CREATE INDEX IF NOT EXISTS "UserReward_walletAddress_status_createdAt_idx" ON "UserReward"("walletAddress", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "UserReward_walletAddress_createdAt_idx" ON "UserReward"("walletAddress", "createdAt");

-- UserQuest
CREATE INDEX IF NOT EXISTS "UserQuest_walletAddress_questId_status_idx" ON "UserQuest"("walletAddress", "questId", "status");
CREATE INDEX IF NOT EXISTS "UserQuest_walletAddress_status_createdAt_idx" ON "UserQuest"("walletAddress", "status", "createdAt");

-- UserNotification
CREATE INDEX IF NOT EXISTS "UserNotification_walletAddress_isRead_createdAt_idx" ON "UserNotification"("walletAddress", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "UserNotification_walletAddress_createdAt_idx" ON "UserNotification"("walletAddress", "createdAt");

-- Game
CREATE INDEX IF NOT EXISTS "Game_status_createdAt_idx" ON "Game"("status", "createdAt");


