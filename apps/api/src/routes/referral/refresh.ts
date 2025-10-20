import { Hono } from "hono";
import { getAuthContext } from "../../context/authContext";
import authMiddleware from "../../middlewares/authMiddleware";
import requirePremium from "../../middlewares/requirePremium";
import ReferralQueueService from "../../services/ReferralQueueService";

const app = new Hono();

// Require authentication for all routes in this file
app.use("*", authMiddleware);
app.use("*", requirePremium);

app.post("/", async (c) => {
  try {
    const auth = getAuthContext(c);
    if (!auth?.walletAddress) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { id } = await ReferralQueueService.enqueueFetchTree({
      force: true,
      walletAddress: auth.walletAddress
    });

    return c.json({ jobId: id, status: "refresh_queued" }, 202);
  } catch (_error) {
    return c.json({ error: "Failed to enqueue referral refresh" }, 500);
  }
});

export default app;
