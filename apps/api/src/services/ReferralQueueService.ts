import logger from "../utils/logger";

interface FetchReferralTreeJobPayload {
  walletAddress: string;
  force: boolean;
}

interface Job<T> {
  id: string;
  name: string;
  payload: T;
  enqueuedAt: Date;
  status: "queued" | "processing" | "completed" | "failed";
}

class ReferralQueueService {
  private jobs = new Map<string, Job<FetchReferralTreeJobPayload>>();

  async enqueueFetchTree(
    payload: FetchReferralTreeJobPayload
  ): Promise<{ id: string }> {
    const id = `referral_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const job: Job<FetchReferralTreeJobPayload> = {
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
      if (!current) return;
      current.status = "processing";
      this.jobs.set(id, current);
      try {
        // In a future phase, call ReferralService.buildUserReferralTree(payload.walletAddress)
        // with cache-bypass; for now just log and complete.
        logger.info(
          `[ReferralQueue] Processing fetch-referral-tree for ${payload.walletAddress} (force=${payload.force})`
        );
        current.status = "completed";
        this.jobs.set(id, current);
      } catch (error) {
        logger.error("[ReferralQueue] Job failed:", error);
        current.status = "failed";
        this.jobs.set(id, current);
      }
    }, 0);

    logger.info(
      `[ReferralQueue] Enqueued job ${id} for ${payload.walletAddress}`
    );
    return { id };
  }
}

export default new ReferralQueueService();
