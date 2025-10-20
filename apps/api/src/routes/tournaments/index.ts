import { zValidator } from "@hono/zod-validator";
import Decimal from "decimal.js";
import { Hono } from "hono";
import { z } from "zod";
import { getAuthContext } from "../../context/authContext";
import authMiddleware from "../../middlewares/authMiddleware";
import prisma from "../../prisma/client";
import { placeholderCoinBurner } from "../../services/CoinBurnerService";
import SegmentationService from "../../services/SegmentationService";

const app = new Hono();

const JoinSchema = z.object({
  coinsBurned: z.string().regex(/^\d+(\.\d+)?$/)
});

app.get("/", async (c) => {
  const type = c.req.query("type");
  const status = c.req.query("status");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    where
  });
  return c.json({ data: tournaments });
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const tournament = await prisma.tournament.findUnique({
    include: { participants: true },
    where: { id }
  });
  if (!tournament) return c.json({ error: "Not found" }, 404);
  return c.json({ data: tournament });
});

app.post(
  "/:id/join",
  authMiddleware,
  zValidator("json", JoinSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { coinsBurned } = JoinSchema.parse(body);
    const amount = new Decimal(coinsBurned);

    const auth = getAuthContext(c);
    const walletAddress = auth?.walletAddress;
    if (!walletAddress) return c.json({ error: "Unauthorized" }, 401);

    const t = await prisma.tournament.findUnique({ where: { id } });
    if (!t) return c.json({ error: "Tournament not found" }, 404);

    const now = new Date();
    if (
      t.status !== "Active" ||
      now < new Date(t.startDate) ||
      now > new Date(t.endDate)
    ) {
      return c.json({ error: "Tournament not joinable" }, 400);
    }

    const seg = await SegmentationService.getForWallet(walletAddress);
    const eligible =
      (t.type === "Balanced" && seg.isBalanced) ||
      (t.type === "Unbalanced" && !seg.isBalanced);
    if (!eligible) return c.json({ error: "Not eligible" }, 403);

    // Enforce minimum coins if configured
    if (t.minCoins) {
      const min = new Decimal(t.minCoins as unknown as string);
      if (amount.lt(min)) {
        return c.json({ error: "Amount below minimum required" }, 400);
      }
    }

    // Enforce equilibrium range ONLY for Balanced tournaments
    if (
      t.type === "Balanced" &&
      (t.equilibriumMin != null || t.equilibriumMax != null)
    ) {
      let equilibrium = seg.equilibriumPoint ?? null;
      if (equilibrium == null) {
        // Fallback: refresh from chain
        const { default: BlockchainService } = await import(
          "../../services/BlockchainService"
        );
        const node = await BlockchainService.getNodeData(walletAddress);
        equilibrium = node?.point ?? null;
      }
      if (equilibrium == null) {
        return c.json({ error: "Unable to read equilibrium point" }, 400);
      }
      const minEq = t.equilibriumMin ?? Number.MIN_SAFE_INTEGER;
      const maxEq = t.equilibriumMax ?? Number.MAX_SAFE_INTEGER;
      if (equilibrium < minEq || equilibrium > maxEq) {
        return c.json({ error: "Equilibrium not in allowed range" }, 403);
      }
    }

    // Real coin deduction will be integrated when coin system is ready
    const burned = await placeholderCoinBurner.burnForTournament({
      amount,
      tournamentId: t.id,
      walletAddress
    });
    if (!burned.ok)
      return c.json({ error: burned.message || "Burn failed" }, 400);

    const existing = await prisma.tournamentParticipant
      .findUnique({
        where: {
          tournamentId_walletAddress: { tournamentId: t.id, walletAddress }
        }
      })
      .catch(() => null);

    if (existing) {
      const newAmount = new Decimal(
        existing.coinsBurned as unknown as string
      ).plus(amount);
      await prisma.tournamentParticipant.update({
        data: { coinsBurned: newAmount.toString(), eligibilityType: t.type },
        where: { id: existing.id }
      });
    } else {
      await prisma.tournamentParticipant.create({
        data: {
          coinsBurned: amount.toString(),
          eligibilityType: t.type,
          tournamentId: t.id,
          walletAddress
        }
      });
    }

    return c.json({ ok: true });
  }
);

export default app;
