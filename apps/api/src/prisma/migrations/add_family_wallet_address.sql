-- Add familyWalletAddress column to User table
ALTER TABLE "User" ADD COLUMN "familyWalletAddress" TEXT;

-- Add index for familyWalletAddress
CREATE INDEX "User_familyWalletAddress_idx" ON "User"("familyWalletAddress");
