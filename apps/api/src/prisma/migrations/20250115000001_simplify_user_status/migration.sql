-- Create the new simplified UserStatus enum
CREATE TYPE "UserStatus" AS ENUM ('Standard', 'Premium');

-- Add the new status column
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'Standard';

-- Migrate existing data from premiumStatus to status
UPDATE "User" 
SET "status" = CASE 
  WHEN "premiumStatus" = 'Standard' THEN 'Standard'::"UserStatus"
  WHEN "premiumStatus" = 'OnChainUnlinked' THEN 'Standard'::"UserStatus"
  WHEN "premiumStatus" = 'ProLinked' THEN 'Premium'::"UserStatus"
  ELSE 'Standard'::"UserStatus"
END;

-- Drop the old premiumStatus column
ALTER TABLE "User" DROP COLUMN "premiumStatus";

-- Create index on the new status column
CREATE INDEX "User_status_idx" ON "User"("status");

-- Drop the old index
DROP INDEX IF EXISTS "User_premiumStatus_idx";

-- Drop the old PremiumStatus enum (now safe to do)
DROP TYPE IF EXISTS "PremiumStatus"; 