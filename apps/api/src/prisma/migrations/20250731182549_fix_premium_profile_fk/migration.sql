-- Create User records for existing PremiumProfile entries to satisfy foreign key constraint
INSERT INTO "User" ("walletAddress", "registrationDate", "lastActiveAt", "totalLogins", "createdAt", "updatedAt")
SELECT DISTINCT "walletAddress", "linkedAt", "linkedAt", 1, "linkedAt", "linkedAt"
FROM "PremiumProfile"
WHERE "walletAddress" NOT IN (SELECT "walletAddress" FROM "User");

-- Add foreign key constraint for PremiumProfile
ALTER TABLE "PremiumProfile" ADD CONSTRAINT "PremiumProfile_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE; 