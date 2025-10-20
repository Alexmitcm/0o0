import Decimal from "decimal.js";

export interface BurnParams {
  walletAddress: string;
  amount: Decimal;
  tournamentId: string;
}

export interface BurnResult {
  ok: boolean;
  message?: string;
}

export interface CoinBurner {
  burnForTournament: (params: BurnParams) => Promise<BurnResult>;
}

// Placeholder implementation: validate and no-op. Records happen in the caller using Prisma.
// Real coin system integration will be implemented when needed.
export const placeholderCoinBurner: CoinBurner = {
  burnForTournament: async ({ amount }) => {
    if (!amount || !(amount instanceof Decimal)) {
      return { message: "Invalid amount", ok: false };
    }
    if (amount.lte(0)) {
      return { message: "Amount must be positive", ok: false };
    }
    return { ok: true };
  }
};
