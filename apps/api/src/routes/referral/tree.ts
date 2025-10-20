import { Hono } from "hono";
import { getAuthContext } from "../../context/authContext";
import authMiddleware from "../../middlewares/authMiddleware";

const app = new Hono();

// Test route to verify routing is working
app.get("/test", (c) => {
  return c.json({ message: "Referral router is working!" });
});

// Simple test route without authentication
app.get("/simple", (c) => {
  return c.json({
    data: [],
    message: "Simple referral route working!",
    meta: {
      maxDepth: 3,
      rootWallet: "test",
      totalNodes: 0
    }
  });
});

// Apply authentication middleware to ensure only logged-in users can access
app.use("*", authMiddleware);

app.get("/", async (c) => {
  try {
    // Get the authenticated user's wallet address from JWT
    const authContext = getAuthContext(c);
    if (!authContext?.walletAddress) {
      return c.json({ error: "Unauthorized - No wallet address found" }, 401);
    }

    const userWallet = authContext.walletAddress;
    const maxDepth = 3; // Fixed max depth for security

    // Import the service dynamically to avoid circular dependencies
    const { default: ReferralService } = await import(
      "../../services/ReferralService"
    );

    // Build the user's own referral tree (downline only)
    const nodes = await ReferralService.buildUserReferralTree(
      userWallet,
      maxDepth
    );

    return c.json({
      data: nodes,
      meta: {
        maxDepth,
        rootWallet: userWallet,
        totalNodes: nodes.length
      }
    });
  } catch (error) {
    console.error("Error fetching user referral tree:", error);
    return c.json({ error: "Failed to fetch referral tree" }, 500);
  }
});

export default app;
