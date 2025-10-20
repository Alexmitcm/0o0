import { Status } from "@hey/data/enums";
import { Hono } from "hono";
import { z } from "zod";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import BlockchainService from "../../services/BlockchainService";
import PremiumV2Service from "../../services/PremiumV2Service";

const app = new Hono();

const determineSchema = z.object({
  profileId: z.string().optional(),
  walletAddress: z.string().min(1, "Wallet address is required")
});

const linkSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  walletAddress: z.string().min(1, "Wallet address is required")
});

const registrationStatusSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required")
});

const verifyRegistrationSchema = z.object({
  profileId: z.string().optional(),
  referrerAddress: z.string().min(1, "Referrer address is required"),
  transactionHash: z.string().min(1, "Transaction hash is required"),
  userAddress: z.string().min(1, "User address is required")
});

const validateReferrerSchema = z.object({
  referrerAddress: z.string().min(1, "Referrer address is required")
});

app.post("/determine-status", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, profileId } = determineSchema.parse(body);

    const result = await PremiumV2Service.determineStatus(
      walletAddress,
      profileId
    );

    return c.json({ data: result, status: Status.Success });
  } catch (error) {
    return c.json(
      {
        error: "Failed to determine status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      500
    );
  }
});

app.post("/link", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = linkSchema.partial({ walletAddress: true }).parse(body);
    const walletAddress =
      parsed.walletAddress ||
      ((c as any).get("walletAddress") as string | undefined);
    if (!walletAddress) {
      return c.json({ error: "Authentication or walletAddress required" }, 401);
    }

    const result = await PremiumV2Service.linkProfile(
      walletAddress,
      parsed.profileId
    );
    return c.json({ data: result, status: Status.Success });
  } catch (error) {
    const err = error as any;
    const code = err?.code;
    if (code === "LINK_ALREADY_EXISTS") {
      return c.json(
        {
          error: "AlreadyLinked",
          linkedProfileId: err?.linkedProfileId,
          message:
            "This premium wallet is already permanently linked to a Lens profile.",
          walletAddress: err?.walletAddress
        },
        400
      );
    }
    return c.json(
      {
        error: "Failed to link profile",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      400
    );
  }
});

// Registration endpoints to support the Premium Registration Modal
app.post("/registration/status", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = registrationStatusSchema.parse(body);

    const isPremium = await BlockchainService.isWalletPremium(walletAddress);
    return c.json({
      data: {
        canRegister: !isPremium,
        isPremiumOnChain: isPremium
      },
      status: Status.Success
    });
  } catch {
    return c.json({ error: "Failed to get registration status" }, 500);
  }
});

// Compatibility endpoint for wallet status used by web app
app.get("/wallet-status", moderateRateLimit, async (c) => {
  try {
    const walletAddress = (c as any).get("walletAddress") as string | undefined;
    if (!walletAddress) {
      return c.json({ error: "Authentication required" }, 401);
    }
    const isPremium = await BlockchainService.isWalletPremium(walletAddress);
    return c.json({
      data: {
        isRegistered: isPremium,
        walletAddress
      },
      status: Status.Success
    });
  } catch {
    return c.json({ error: "Failed to fetch wallet status" }, 500);
  }
});

app.post("/registration/validate-referrer", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { referrerAddress } = validateReferrerSchema.parse(body);
    const result = await BlockchainService.validateReferrer(referrerAddress);
    return c.json({ data: result, status: Status.Success });
  } catch {
    return c.json({ error: "Failed to validate referrer" }, 500);
  }
});

app.post("/registration/verify", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { userAddress, referrerAddress, transactionHash, profileId } =
      verifyRegistrationSchema.parse(body);

    const ok = await BlockchainService.verifyRegistrationTransaction(
      userAddress,
      referrerAddress,
      transactionHash
    );
    if (!ok) {
      return c.json({ error: "Registration verification failed" }, 400);
    }

    let linkResult: { linkedProfileId?: string } = {};
    if (profileId) {
      try {
        const linked = await PremiumV2Service.linkProfile(
          userAddress,
          profileId
        );
        linkResult = { linkedProfileId: linked.linkedProfileId };
      } catch {
        // If linking fails (e.g., ownership mismatch), we still return success for registration
      }
    }

    return c.json({
      data: {
        verified: true,
        ...linkResult
      },
      status: Status.Success
    });
  } catch {
    return c.json({ error: "Failed to verify registration" }, 500);
  }
});

// Available profiles for premium wallets that are not linked yet
app.post("/available-profiles", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = registrationStatusSchema.parse(body);

    const [isPremium, existingLink] = await Promise.all([
      BlockchainService.isWalletPremium(walletAddress),
      (await import("../../prisma/client")).default.premiumProfile.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() }
      })
    ]);

    if (!isPremium || existingLink) {
      return c.json({
        data: { canLink: false, profiles: [] },
        status: Status.Success
      });
    }

    const profiles =
      (await (
        await import("../../services/ProfileService")
      ).default.getProfilesByWallet(walletAddress)) || [];
    return c.json({
      data: {
        canLink: true,
        profiles
      },
      status: Status.Success
    });
  } catch {
    return c.json({ error: "Failed to get available profiles" }, 500);
  }
});

// Auto-link first profile for premium wallets
app.post("/auto-link", moderateRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = registrationStatusSchema.parse(body);

    const profiles =
      (await (
        await import("../../services/ProfileService")
      ).default.getProfilesByWallet(walletAddress)) || [];
    if (profiles.length === 0) {
      return c.json({ error: "No profiles found for this wallet" }, 400);
    }
    const firstProfileId = profiles[0].id;
    const result = await PremiumV2Service.linkProfile(
      walletAddress,
      firstProfileId
    );
    return c.json({
      data: { linkedProfileId: result.linkedProfileId },
      status: Status.Success
    });
  } catch {
    return c.json({ error: "Failed to auto-link profile" }, 500);
  }
});

export default app;
