import Decimal from "decimal.js";

export interface PrizeParticipant {
  id: string;
  walletAddress: string;
  coinsBurned: Decimal;
}

export interface PrizeResult extends PrizeParticipant {
  prizeShareBps: number;
  prizeAmount: Decimal;
}

export const calculatePrizes = (
  participants: PrizeParticipant[],
  prizePool: Decimal
): PrizeResult[] => {
  const total = participants.reduce(
    (acc, p) => acc.plus(p.coinsBurned),
    new Decimal(0)
  );
  if (total.lte(0)) {
    return participants.map((p) => ({
      ...p,
      prizeAmount: new Decimal(0),
      prizeShareBps: 0
    }));
  }

  const provisional = participants.map((p) => {
    const ratio = p.coinsBurned.div(total);
    const bps = ratio
      .mul(10000)
      .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
      .toNumber();
    const amount = prizePool.mul(ratio);
    return { ...p, prizeAmount: amount, prizeShareBps: bps };
  });

  // Reconcile rounding: ensure total <= prizePool
  const sum = provisional.reduce(
    (acc, p) => acc.plus(p.prizeAmount),
    new Decimal(0)
  );
  if (sum.lte(prizePool)) return provisional;

  const factor = prizePool.div(sum);
  return provisional.map((p) => ({
    ...p,
    prizeAmount: p.prizeAmount.mul(factor)
  }));
};
