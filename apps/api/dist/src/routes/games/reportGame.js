"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportGame = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const reportGameSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    reason: zod_1.z.enum(["Bug", "Error", "Other"])
});
const reportGame = async (c) => {
    try {
        const slug = c.req.param("slug");
        const body = await c.req.json();
        const validatedData = reportGameSchema.parse(body);
        // Get the game
        const game = await client_1.default.game.findUnique({
            where: { slug }
        });
        if (!game) {
            return c.json({ error: "Game not found" }, 404);
        }
        // Get user (optional - anonymous reports are allowed)
        const user = c.get("user");
        const reporterAddress = user?.walletAddress || "anonymous";
        // Create game report
        const gameReport = await client_1.default.gameReport.create({
            data: {
                description: validatedData.description || "",
                gameId: game.id,
                reason: validatedData.reason,
                reporterAddress
            }
        });
        return c.json({ report: gameReport, success: true });
    }
    catch (error) {
        console.error("Report game error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.reportGame = reportGame;
