-- Manual creation of Tournament tables when Prisma migrate cannot use a shadow DB

-- Tournament
CREATE TABLE IF NOT EXISTS "Tournament" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'Balanced' | 'Unbalanced'
  "status" TEXT NOT NULL, -- 'Upcoming' | 'Active' | 'Ended' | 'Settled'
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "prizePool" NUMERIC(38,18) NOT NULL,
  "minCoins" NUMERIC(38,18),
  "equilibriumMin" INTEGER,
  "equilibriumMax" INTEGER,
  "prizeTokenAddress" TEXT,
  "chainId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "settledAt" TIMESTAMP(3),
  "settlementTxHash" TEXT
);

CREATE INDEX IF NOT EXISTS "Tournament_status_startDate_idx"
  ON "Tournament" ("status","startDate");
CREATE INDEX IF NOT EXISTS "Tournament_type_status_idx"
  ON "Tournament" ("type","status");

-- TournamentParticipant
CREATE TABLE IF NOT EXISTS "TournamentParticipant" (
  "id" TEXT PRIMARY KEY,
  "tournamentId" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "eligibilityType" TEXT NOT NULL, -- 'Balanced' | 'Unbalanced'
  "coinsBurned" NUMERIC(38,18) NOT NULL,
  "prizeShareBps" INTEGER,
  "prizeAmount" NUMERIC(38,18),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "TournamentParticipant_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE,
  CONSTRAINT "TournamentParticipant_walletAddress_fkey"
    FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TournamentParticipant_tournamentId_walletAddress_key"
  ON "TournamentParticipant" ("tournamentId","walletAddress");
CREATE INDEX IF NOT EXISTS "TournamentParticipant_tournamentId_idx"
  ON "TournamentParticipant" ("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentParticipant_walletAddress_idx"
  ON "TournamentParticipant" ("walletAddress");

-- ReferralBalanceCache
CREATE TABLE IF NOT EXISTS "ReferralBalanceCache" (
  "id" TEXT PRIMARY KEY,
  "walletAddress" TEXT NOT NULL UNIQUE,
  "isBalanced" BOOLEAN NOT NULL,
  "leftCount" INTEGER NOT NULL,
  "rightCount" INTEGER NOT NULL,
  "equilibriumPoint" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);


