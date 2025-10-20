import { Hono } from "hono";
import { getAuthContext } from "../../context/authContext";
import authMiddleware from "../../middlewares/authMiddleware";
import requirePremium from "../../middlewares/requirePremium";
import prisma from "../../prisma/client";
import BlockchainService from "../../services/BlockchainService";

const app = new Hono();

app.use("*", authMiddleware);
app.use("*", requirePremium);

app.get("/", async (c) => {
  try {
    const auth = getAuthContext(c);
    if (!auth?.walletAddress) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const wallet = auth.walletAddress;

    // Read on-chain balances directly
    const [referralWei, game] = await Promise.all([
      BlockchainService.getReferralReward(wallet),
      BlockchainService.getGameVaultRewards(wallet)
    ]);

    const referral = referralWei;
    const balancedGame = game.balanced;
    const unbalancedGame = game.unbalanced;

    // Update local DB snapshot (if schema has a place; here we store in UserStats totalEarnings-like field)
    try {
      await prisma.userStats.upsert({
        create: {
          referralCount: 0,
          totalEarnings: referralWei.toString() as any,
          walletAddress: wallet
        },
        update: {
          totalEarnings: referralWei.toString() as any
        },
        where: { walletAddress: wallet }
      });
    } catch {
      // best-effort snapshot
    }

    // Convert to human-readable decimal strings (assume 18 decimals)
    const toDecimal = (v: bigint) => Number(v) / 1e18;
    const referralDec = toDecimal(referral);
    const balancedDec = toDecimal(balancedGame);
    const unbalancedDec = toDecimal(unbalancedGame);
    const total = referralDec + balancedDec + unbalancedDec;

    return c.json({
      sources: {
        balancedGame: balancedDec.toFixed(2),
        referral: referralDec.toFixed(2),
        unbalancedGame: unbalancedDec.toFixed(2)
      },
      totalClaimableBalance: total.toFixed(2)
    });
  } catch {
    return c.json({ error: "Failed to refresh reward balance" }, 500);
  }
});

export default app;
