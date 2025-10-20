"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const decimal_js_1 = __importDefault(require("decimal.js"));
const hono_1 = require("hono");
const zod_1 = require("zod");
const authContext_1 = require("../../context/authContext");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const client_1 = __importDefault(require("../../prisma/client"));
const CoinBurnerService_1 = require("../../services/CoinBurnerService");
const SegmentationService_1 = __importDefault(require("../../services/SegmentationService"));
const app = new hono_1.Hono();
const JoinSchema = zod_1.z.object({
    coinsBurned: zod_1.z.string().regex(/^\d+(\.\d+)?$/)
});
app.get("/", async (c) => {
    const type = c.req.query("type");
    const status = c.req.query("status");
    const where = {};
    if (type)
        where.type = type;
    if (status)
        where.status = status;
    const tournaments = await client_1.default.tournament.findMany({
        orderBy: { startDate: "asc" },
        where
    });
    return c.json({ data: tournaments });
});
app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const tournament = await client_1.default.tournament.findUnique({
        include: { participants: true },
        where: { id }
    });
    if (!tournament)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: tournament });
});
app.post("/:id/join", authMiddleware_1.default, (0, zod_validator_1.zValidator)("json", JoinSchema), async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { coinsBurned } = JoinSchema.parse(body);
    const amount = new decimal_js_1.default(coinsBurned);
    const auth = (0, authContext_1.getAuthContext)(c);
    const walletAddress = auth?.walletAddress;
    if (!walletAddress)
        return c.json({ error: "Unauthorized" }, 401);
    const t = await client_1.default.tournament.findUnique({ where: { id } });
    if (!t)
        return c.json({ error: "Tournament not found" }, 404);
    const now = new Date();
    if (t.status !== "Active" ||
        now < new Date(t.startDate) ||
        now > new Date(t.endDate)) {
        return c.json({ error: "Tournament not joinable" }, 400);
    }
    const seg = await SegmentationService_1.default.getForWallet(walletAddress);
    const eligible = (t.type === "Balanced" && seg.isBalanced) ||
        (t.type === "Unbalanced" && !seg.isBalanced);
    if (!eligible)
        return c.json({ error: "Not eligible" }, 403);
    // Enforce minimum coins if configured
    if (t.minCoins) {
        const min = new decimal_js_1.default(t.minCoins);
        if (amount.lt(min)) {
            return c.json({ error: "Amount below minimum required" }, 400);
        }
    }
    // Enforce equilibrium range ONLY for Balanced tournaments
    if (t.type === "Balanced" &&
        (t.equilibriumMin != null || t.equilibriumMax != null)) {
        let equilibrium = seg.equilibriumPoint ?? null;
        if (equilibrium == null) {
            // Fallback: refresh from chain
            const { default: BlockchainService } = await Promise.resolve().then(() => __importStar(require("../../services/BlockchainService")));
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
    // TODO: integrate real coin deduction once coin system exists
    const burned = await CoinBurnerService_1.placeholderCoinBurner.burnForTournament({
        amount,
        tournamentId: t.id,
        walletAddress
    });
    if (!burned.ok)
        return c.json({ error: burned.message || "Burn failed" }, 400);
    const existing = await client_1.default.tournamentParticipant
        .findUnique({
        where: {
            tournamentId_walletAddress: { tournamentId: t.id, walletAddress }
        }
    })
        .catch(() => null);
    if (existing) {
        const newAmount = new decimal_js_1.default(existing.coinsBurned).plus(amount);
        await client_1.default.tournamentParticipant.update({
            data: { coinsBurned: newAmount.toString(), eligibilityType: t.type },
            where: { id: existing.id }
        });
    }
    else {
        await client_1.default.tournamentParticipant.create({
            data: {
                coinsBurned: amount.toString(),
                eligibilityType: t.type,
                tournamentId: t.id,
                walletAddress
            }
        });
    }
    return c.json({ ok: true });
});
exports.default = app;
