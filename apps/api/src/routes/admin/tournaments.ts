import { zValidator } from "@hono/zod-validator";
import Decimal from "decimal.js";
import { Hono } from "hono";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { z } from "zod";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import { adminOnly } from "../../middlewares/security";
import prisma from "../../prisma/client";
import { calculatePrizes } from "../../services/PrizeService";

const app = new Hono();

// Apply admin authentication to all routes
app.use("*", adminOnly);

const CreateSchema = z.object({
  chainId: z.number().optional(),
  endDate: z.coerce.date(),
  equilibriumMax: z.number().int().optional(),
  equilibriumMin: z.number().int().optional(),
  minCoins: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional(),
  name: z.string().min(3),
  prizePool: z.string().regex(/^\d+(\.\d+)?$/),
  prizeTokenAddress: z.string().optional(),
  startDate: z.coerce.date(),
  status: z.enum(["Upcoming", "Active"]).default("Upcoming"),
  type: z.enum(["Balanced", "Unbalanced"])
});

const UpdateSchema = CreateSchema.partial();

const ListQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  status: z.enum(["Upcoming", "Active", "Ended", "Settled"]).optional(),
  type: z.enum(["Balanced", "Unbalanced"]).optional()
});

app.get("/", moderateRateLimit, async (c) => {
  const q = ListQuerySchema.parse({
    limit: c.req.query("limit") ?? undefined,
    offset: c.req.query("offset") ?? undefined,
    status: c.req.query("status") ?? undefined,
    type: c.req.query("type") ?? undefined
  });

  const take = q.limit ? Number.parseInt(q.limit, 10) : 50;
  const skip = q.offset ? Number.parseInt(q.offset, 10) : 0;
  const where: Record<string, unknown> = {};
  if (q.type) where.type = q.type;
  if (q.status) where.status = q.status;

  const [items, total] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { startDate: "desc" },
      skip,
      take,
      where
    }),
    prisma.tournament.count({ where })
  ]);
  return c.json({
    data: items,
    pagination: { limit: take, offset: skip, total }
  });
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const t = await prisma.tournament.findUnique({
    include: { participants: true },
    where: { id }
  });
  if (!t) return c.json({ error: "Not found" }, 404);
  return c.json({ data: t });
});

app.post("/", zValidator("json", CreateSchema), async (c) => {
  const input = CreateSchema.parse(await c.req.json());
  if (input.endDate <= input.startDate)
    return c.json({ error: "endDate must be after startDate" }, 400);
  const created = await prisma.tournament.create({
    data: {
      chainId: input.chainId,
      endDate: input.endDate,
      equilibriumMax: input.equilibriumMax,
      equilibriumMin: input.equilibriumMin,
      minCoins: input.minCoins
        ? new Decimal(input.minCoins).toString()
        : undefined,
      name: input.name,
      prizePool: new Decimal(input.prizePool).toString(),
      prizeTokenAddress: input.prizeTokenAddress,
      startDate: input.startDate,
      status: input.status,
      type: input.type
    }
  });
  return c.json({ data: created });
});

app.put("/:id", zValidator("json", UpdateSchema), async (c) => {
  const id = c.req.param("id");
  const t = await prisma.tournament.findUnique({ where: { id } });
  if (!t) return c.json({ error: "Not found" }, 404);
  if (t.status !== "Upcoming")
    return c.json({ error: "Only Upcoming tournaments can be edited" }, 400);
  const body = UpdateSchema.parse(await c.req.json());
  const data: any = { ...body };
  if (body.prizePool) data.prizePool = new Decimal(body.prizePool).toString();
  const updated = await prisma.tournament.update({ data, where: { id } });
  return c.json({ data: updated });
});

app.post("/:id/calc", async (c) => {
  const id = c.req.param("id");
  const t = await prisma.tournament.findUnique({
    include: { participants: true },
    where: { id }
  });
  if (!t) return c.json({ error: "Not found" }, 404);
  if (t.status !== "Ended")
    return c.json({ error: "Tournament must be Ended to calculate" }, 400);
  const prizePool = new Decimal(t.prizePool as unknown as string);
  const results = calculatePrizes(
    t.participants.map((p) => ({
      coinsBurned: new Decimal(p.coinsBurned as unknown as string),
      id: p.id,
      walletAddress: p.walletAddress
    })),
    prizePool
  );
  await prisma.$transaction(
    results.map((r) =>
      prisma.tournamentParticipant.update({
        data: {
          prizeAmount: r.prizeAmount.toString(),
          prizeShareBps: r.prizeShareBps
        },
        where: { id: r.id }
      })
    )
  );
  return c.json({ ok: true });
});

app.post("/:id/settle", async (c) => {
  const id = c.req.param("id");
  const t = await prisma.tournament.findUnique({
    include: { participants: true },
    where: { id }
  });
  if (!t) return c.json({ error: "Not found" }, 404);
  if (t.status !== "Ended")
    return c.json({ error: "Tournament must be Ended" }, 400);

  const pk = process.env.PRIVATE_KEY;
  const rpc = process.env.INFURA_URL;
  // Choose vault by tournament type; fall back to GAME_VAULT_ADDRESS if provided
  const vaultAddress =
    t.type === "Balanced"
      ? process.env.BALANCED_GAME_VAULT_ADDRESS ||
        process.env.GAME_VAULT_ADDRESS
      : process.env.UNBALANCED_GAME_VAULT_ADDRESS ||
        process.env.GAME_VAULT_ADDRESS;
  if (!pk || !rpc || !vaultAddress)
    return c.json(
      {
        error: "Missing chain config: PRIVATE_KEY, INFURA_URL, or vault address"
      },
      500
    );

  const account = privateKeyToAccount(`0x${pk.replace(/^0x/, "")}` as any);
  const walletClient = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(rpc)
  });

  const rewards = t.participants
    .filter(
      (p) =>
        p.prizeAmount && new Decimal(p.prizeAmount as unknown as string).gt(0)
    )
    .map((p) => ({
      amount: new Decimal(p.prizeAmount as unknown as string),
      wallet: p.walletAddress
    }));

  if (!rewards.length) return c.json({ error: "No rewards to settle" }, 400);

  // Assume USDT decimals 6 or 18? We'll default 6 for now; make configurable if needed.
  const decimals = Number(process.env.PRIZE_TOKEN_DECIMALS || 6);
  const toWei = (d: Decimal) =>
    BigInt(
      d
        .mul(new Decimal(10).pow(decimals))
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toString()
    );

  const tuple = rewards.map((r) => ({
    balance: toWei(r.amount),
    player: r.wallet as `0x${string}`
  }));

  const GAME_VAULT_ABI = parseAbi([
    "function playersReward((address player,uint256 balance)[] _playerSet)"
  ]);

  const hash = await walletClient.writeContract({
    abi: GAME_VAULT_ABI as any,
    address: vaultAddress as `0x${string}`,
    args: [tuple],
    functionName: "playersReward"
  });

  await prisma.tournament.update({
    data: { settledAt: new Date(), settlementTxHash: hash, status: "Settled" },
    where: { id: t.id }
  });
  return c.json({ txHash: hash });
});

export default app;
