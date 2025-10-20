"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
class ReferralQueueService {
    jobs = new Map();
    async enqueueFetchTree(payload) {
        const id = `referral_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const job = {
            enqueuedAt: new Date(),
            id,
            name: "fetch-referral-tree",
            payload,
            status: "queued"
        };
        this.jobs.set(id, job);
        // Fire-and-forget background processing placeholder
        setTimeout(async () => {
            const current = this.jobs.get(id);
            if (!current)
                return;
            current.status = "processing";
            this.jobs.set(id, current);
            try {
                // In a future phase, call ReferralService.buildUserReferralTree(payload.walletAddress)
                // with cache-bypass; for now just log and complete.
                logger_1.default.info(`[ReferralQueue] Processing fetch-referral-tree for ${payload.walletAddress} (force=${payload.force})`);
                current.status = "completed";
                this.jobs.set(id, current);
            }
            catch (error) {
                logger_1.default.error("[ReferralQueue] Job failed:", error);
                current.status = "failed";
                this.jobs.set(id, current);
            }
        }, 0);
        logger_1.default.info(`[ReferralQueue] Enqueued job ${id} for ${payload.walletAddress}`);
        return { id };
    }
}
exports.default = new ReferralQueueService();
