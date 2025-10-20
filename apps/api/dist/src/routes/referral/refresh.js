"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authContext_1 = require("../../context/authContext");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const requirePremium_1 = __importDefault(require("../../middlewares/requirePremium"));
const ReferralQueueService_1 = __importDefault(require("../../services/ReferralQueueService"));
const app = new hono_1.Hono();
// Require authentication for all routes in this file
app.use("*", authMiddleware_1.default);
app.use("*", requirePremium_1.default);
app.post("/", async (c) => {
    try {
        const auth = (0, authContext_1.getAuthContext)(c);
        if (!auth?.walletAddress) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const { id } = await ReferralQueueService_1.default.enqueueFetchTree({
            force: true,
            walletAddress: auth.walletAddress
        });
        return c.json({ jobId: id, status: "refresh_queued" }, 202);
    }
    catch (_error) {
        return c.json({ error: "Failed to enqueue referral refresh" }, 500);
    }
});
exports.default = app;
