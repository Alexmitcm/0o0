"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * BlockchainListenerService
 * Listens to Referral contract Register events over WebSocket and
 * updates local DB user status to Premium in real-time.
 */
class BlockchainListenerService {
    unwatch = null;
    getReferralAddress() {
        const addr = process.env.REFERRAL_CONTRACT_ADDRESS;
        if (!addr) {
            throw new Error("REFERRAL_CONTRACT_ADDRESS not set");
        }
        return addr;
    }
    getWebSocketUrl() {
        // Prefer explicit INFURA_WS_URL; fall back to INFURA_URL if it looks ws(s)://
        const ws = process.env.INFURA_WS_URL;
        if (ws?.startsWith("ws"))
            return ws;
        const httpUrl = process.env.INFURA_URL;
        if (httpUrl?.startsWith("ws"))
            return httpUrl;
        return null;
    }
    async updateUserToPremium(walletAddress) {
        const normalized = walletAddress.toLowerCase();
        try {
            const user = await client_1.default.user.findUnique({
                select: { status: true, walletAddress: true },
                where: { walletAddress: normalized }
            });
            if (!user) {
                // Nothing to do if user not yet created on our side
                return;
            }
            if (user.status === "Premium") {
                return;
            }
            await client_1.default.user.update({
                data: { premiumUpgradedAt: new Date(), status: "Premium" },
                where: { walletAddress: normalized }
            });
            logger_1.default.info(`[Listener] Upgraded user to Premium via on-chain event: ${normalized}`);
        }
        catch (error) {
            logger_1.default.error(`[Listener] Failed to update user to Premium for ${normalized}:`, error);
        }
    }
    start() {
        if (this.unwatch) {
            return; // already started
        }
        const wsUrl = this.getWebSocketUrl();
        if (!wsUrl) {
            logger_1.default.warn("[Listener] INFURA_WS_URL not set (or not ws://). Skipping blockchain event listener.");
            return;
        }
        try {
            const client = (0, viem_1.createPublicClient)({
                chain: chains_1.arbitrum,
                transport: (0, viem_1.webSocket)(wsUrl)
            });
            const referralAddress = this.getReferralAddress();
            // Minimal ABI for the Register event; adjust names if your contract differs
            const REGISTER_EVENT_ABI = [
                (0, viem_1.parseAbiItem)("event Register(address indexed player, address indexed referrer)")
            ];
            logger_1.default.info("[Listener] Starting watchContractEvent for Register...");
            this.unwatch = client.watchContractEvent({
                abi: REGISTER_EVENT_ABI,
                address: referralAddress,
                eventName: "Register",
                onError: (err) => {
                    logger_1.default.error("[Listener] Error in watchContractEvent:", err);
                },
                onLogs: async (logs) => {
                    try {
                        for (const log of logs) {
                            // viem decodes args based on ABI; expect player/referrer
                            const args = log.args || {};
                            const player = args.player || args.user || args.account || args[0];
                            if (!player) {
                                logger_1.default.warn("[Listener] Register log without player arg", log);
                                continue;
                            }
                            await this.updateUserToPremium(player);
                        }
                    }
                    catch (error) {
                        logger_1.default.error("[Listener] Error processing logs:", error);
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error("[Listener] Failed to start blockchain listener:", error);
        }
    }
    stop() {
        if (this.unwatch) {
            try {
                this.unwatch();
                logger_1.default.info("[Listener] Stopped blockchain event listener.");
            }
            catch {
                // noop
            }
            finally {
                this.unwatch = null;
            }
        }
    }
}
exports.default = new BlockchainListenerService();
