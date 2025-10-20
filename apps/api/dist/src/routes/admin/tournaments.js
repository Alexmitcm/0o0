"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const decimal_js_1 = __importDefault(require("decimal.js"));
const hono_1 = require("hono");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const zod_1 = require("zod");
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const security_1 = require("../../middlewares/security");
const client_1 = __importDefault(require("../../prisma/client"));
const PrizeService_1 = require("../../services/PrizeService");
const app = new hono_1.Hono();
// Apply admin authentication to all routes
app.use("*", security_1.adminOnly);
const CreateSchema = zod_1.z.object({
    chainId: zod_1.z.number().optional(),
    endDate: zod_1.z.coerce.date(),
    equilibriumMax: zod_1.z.number().int().optional(),
    equilibriumMin: zod_1.z.number().int().optional(),
    minCoins: zod_1.z
        .string()
        .regex(/^\d+(\.\d+)?$/)
        .optional(),
    name: zod_1.z.string().min(3),
    prizePool: zod_1.z.string().regex(/^\d+(\.\d+)?$/),
    prizeTokenAddress: zod_1.z.string().optional(),
    startDate: zod_1.z.coerce.date(),
    status: zod_1.z.enum(["Upcoming", "Active"]).default("Upcoming"),
    type: zod_1.z.enum(["Balanced", "Unbalanced"])
});
const UpdateSchema = CreateSchema.partial();
const ListQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
    status: zod_1.z.enum(["Upcoming", "Active", "Ended", "Settled"]).optional(),
    type: zod_1.z.enum(["Balanced", "Unbalanced"]).optional()
});
app.get("/", rateLimiter_1.moderateRateLimit, async (c) => {
    const q = ListQuerySchema.parse({
        limit: c.req.query("limit") ?? undefined,
        offset: c.req.query("offset") ?? undefined,
        status: c.req.query("status") ?? undefined,
        type: c.req.query("type") ?? undefined
    });
    const take = q.limit ? Number.parseInt(q.limit, 10) : 50;
    const skip = q.offset ? Number.parseInt(q.offset, 10) : 0;
    const where = {};
    if (q.type)
        where.type = q.type;
    if (q.status)
        where.status = q.status;
    const [items, total] = await Promise.all([
        client_1.default.tournament.findMany({
            orderBy: { startDate: "desc" },
            skip,
            take,
            where
        }),
        client_1.default.tournament.count({ where })
    ]);
    return c.json({
        data: items,
        pagination: { limit: take, offset: skip, total }
    });
});
app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const t = await client_1.default.tournament.findUnique({
        include: { participants: true },
        where: { id }
    });
    if (!t)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: t });
});
app.post("/", (0, zod_validator_1.zValidator)("json", CreateSchema), async (c) => {
    const input = CreateSchema.parse(await c.req.json());
    if (input.endDate <= input.startDate)
        return c.json({ error: "endDate must be after startDate" }, 400);
    const created = await client_1.default.tournament.create({
        data: {
            chainId: input.chainId,
            endDate: input.endDate,
            equilibriumMax: input.equilibriumMax,
            equilibriumMin: input.equilibriumMin,
            minCoins: input.minCoins
                ? new decimal_js_1.default(input.minCoins).toString()
                : undefined,
            name: input.name,
            prizePool: new decimal_js_1.default(input.prizePool).toString(),
            prizeTokenAddress: input.prizeTokenAddress,
            startDate: input.startDate,
            status: input.status,
            type: input.type
        }
    });
    return c.json({ data: created });
});
app.put("/:id", (0, zod_validator_1.zValidator)("json", UpdateSchema), async (c) => {
    const id = c.req.param("id");
    const t = await client_1.default.tournament.findUnique({ where: { id } });
    if (!t)
        return c.json({ error: "Not found" }, 404);
    if (t.status !== "Upcoming")
        return c.json({ error: "Only Upcoming tournaments can be edited" }, 400);
    const body = UpdateSchema.parse(await c.req.json());
    const data = { ...body };
    if (body.prizePool)
        data.prizePool = new decimal_js_1.default(body.prizePool).toString();
    const updated = await client_1.default.tournament.update({ data, where: { id } });
    return c.json({ data: updated });
});
app.post("/:id/calc", async (c) => {
    const id = c.req.param("id");
    const t = await client_1.default.tournament.findUnique({
        include: { participants: true },
        where: { id }
    });
    if (!t)
        return c.json({ error: "Not found" }, 404);
    if (t.status !== "Ended")
        return c.json({ error: "Tournament must be Ended to calculate" }, 400);
    const prizePool = new decimal_js_1.default(t.prizePool);
    const results = (0, PrizeService_1.calculatePrizes)(t.participants.map((p) => ({
        coinsBurned: new decimal_js_1.default(p.coinsBurned),
        id: p.id,
        walletAddress: p.walletAddress
    })), prizePool);
    await client_1.default.$transaction(results.map((r) => client_1.default.tournamentParticipant.update({
        data: {
            prizeAmount: r.prizeAmount.toString(),
            prizeShareBps: r.prizeShareBps
        },
        where: { id: r.id }
    })));
    return c.json({ ok: true });
});
app.post("/:id/settle", async (c) => {
    const id = c.req.param("id");
    const t = await client_1.default.tournament.findUnique({
        include: { participants: true },
        where: { id }
    });
    if (!t)
        return c.json({ error: "Not found" }, 404);
    if (t.status !== "Ended")
        return c.json({ error: "Tournament must be Ended" }, 400);
    const pk = process.env.PRIVATE_KEY;
    const rpc = process.env.INFURA_URL;
    // Choose vault by tournament type; fall back to GAME_VAULT_ADDRESS if provided
    const vaultAddress = t.type === "Balanced"
        ? process.env.BALANCED_GAME_VAULT_ADDRESS ||
            process.env.GAME_VAULT_ADDRESS
        : process.env.UNBALANCED_GAME_VAULT_ADDRESS ||
            process.env.GAME_VAULT_ADDRESS;
    if (!pk || !rpc || !vaultAddress)
        return c.json({
            error: "Missing chain config: PRIVATE_KEY, INFURA_URL, or vault address"
        }, 500);
    const account = (0, accounts_1.privateKeyToAccount)(`0x${pk.replace(/^0x/, "")}`);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.arbitrum,
        transport: (0, viem_1.http)(rpc)
    });
    const rewards = t.participants
        .filter((p) => p.prizeAmount && new decimal_js_1.default(p.prizeAmount).gt(0))
        .map((p) => ({
        amount: new decimal_js_1.default(p.prizeAmount),
        wallet: p.walletAddress
    }));
    if (!rewards.length)
        return c.json({ error: "No rewards to settle" }, 400);
    // Assume USDT decimals 6 or 18? We'll default 6 for now; make configurable if needed.
    const decimals = Number(process.env.PRIZE_TOKEN_DECIMALS || 6);
    const toWei = (d) => BigInt(d
        .mul(new decimal_js_1.default(10).pow(decimals))
        .toDecimalPlaces(0, decimal_js_1.default.ROUND_FLOOR)
        .toString());
    const tuple = rewards.map((r) => ({
        balance: toWei(r.amount),
        player: r.wallet
    }));
    const GAME_VAULT_ABI = (0, viem_1.parseAbi)([
        "function playersReward((address player,uint256 balance)[] _playerSet)"
    ]);
    const hash = await walletClient.writeContract({
        abi: GAME_VAULT_ABI,
        address: vaultAddress,
        args: [tuple],
        functionName: "playersReward"
    });
    await client_1.default.tournament.update({
        data: { settledAt: new Date(), settlementTxHash: hash, status: "Settled" },
        where: { id: t.id }
    });
    return c.json({ txHash: hash });
});
exports.default = app;
