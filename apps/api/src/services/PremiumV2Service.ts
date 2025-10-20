import { CONFIG } from "../config/env";
import prisma from "../prisma/client";
import { normalizeAddress } from "../utils/address";
import logger from "../utils/logger";
import { getRedis, setRedis } from "../utils/redis";
import BlockchainService from "./BlockchainService";
import { profileService } from "./ProfileService";

export interface PremiumStatusResponse {
  userStatus: "Standard" | "Premium";
  linkedProfileId?: string;
  message?: string;
  canRegisterPremium: boolean;
  canLink: boolean;
}

class PremiumV2Service {
  private normalizeWalletAddress(address: string): string {
    return normalizeAddress(address);
  }

  /**
   * Determine user's status according to hard rules and optionally auto-link on first connect.
   * If wallet is premium and has no link yet and a valid owned profileId is provided, this will link permanently.
   */
  async determineStatus(
    walletAddress: string,
    profileId?: string
  ): Promise<PremiumStatusResponse> {
    console.log("\n--- [DEBUG] Starting determineStatus ---");
    console.log(`[DEBUG] Received Wallet Address: ${walletAddress}`);
    console.log(`[DEBUG] Received Profile ID: ${profileId}`);

    const normalizedAddress = this.normalizeWalletAddress(walletAddress);
    const normalizedProfileId = profileId ? profileId.toLowerCase() : undefined;
    console.log(`[DEBUG] Normalized Address: ${normalizedAddress}`);
    console.log(`[DEBUG] Normalized Profile ID: ${normalizedProfileId}`);

    // 1) Existing permanent link lookup (DB is source of truth)
    let existingLink = null;
    try {
      existingLink = await prisma.premiumProfile.findFirst({
        where: {
          isActive: true, // Only look for active links
          walletAddress: normalizedAddress
        }
      });
      console.log(
        "[DEBUG] Database link lookup result (existingLink):",
        existingLink
      );
    } catch (error) {
      console.error("[DEBUG] ERROR during database link lookup:", error);
    }

    // If already linked in our DB, treat as Premium regardless of immediate on-chain response
    if (existingLink) {
      console.log("[DEBUG] Wallet has existing permanent link in DB");
      if (
        normalizedProfileId &&
        existingLink.profileId.toLowerCase() !== normalizedProfileId
      ) {
        console.log(
          "[DEBUG] Current profile differs from linked profile - REJECTION case"
        );
        const finalResponse: PremiumStatusResponse = {
          canLink: false,
          canRegisterPremium: false,
          linkedProfileId: existingLink.profileId,
          message:
            "Your premium wallet is already connected to another one of your Lens profiles and is premium. You are not allowed to make this profile premium.",
          userStatus: "Standard"
        };
        console.log("[DEBUG] Final response being sent:", finalResponse);
        console.log("--- [DEBUG] Ending determineStatus ---\n");
        return finalResponse;
      }
      const finalResponse: PremiumStatusResponse = {
        canLink: false,
        canRegisterPremium: false,
        linkedProfileId: existingLink.profileId,
        userStatus: "Premium"
      };
      console.log("[DEBUG] Final response being sent:", finalResponse);
      console.log("--- [DEBUG] Ending determineStatus ---\n");
      return finalResponse;
    }

    // 2) On-chain premium check (NodeSet) as fallback for unlinked wallets
    let isPremium = false;
    try {
      const cacheKey = `premium:status:${normalizedAddress}`;
      const cached = await getRedis(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        isPremium = Boolean(parsed?.isPremium);
      } else {
        isPremium = await BlockchainService.isWalletPremium(normalizedAddress);
        await setRedis(
          cacheKey,
          { isPremium },
          CONFIG.PREMIUM_STATUS_TTL_SECONDS
        );
      }
      console.log(
        `[DEBUG] On-chain premium check result (isPremium): ${isPremium}`
      );
    } catch (error) {
      console.error("[DEBUG] ERROR during on-chain premium check:", error);
      // Fall through with isPremium = false
    }

    let finalResponse: PremiumStatusResponse;

    if (!isPremium) {
      finalResponse = {
        canLink: false,
        canRegisterPremium: true,
        userStatus: "Standard"
      };
      console.log(
        "[DEBUG] Wallet is NOT premium on-chain, returning Standard status"
      );
    }

    // Wallet is premium on-chain but not yet linked
    else if (normalizedProfileId) {
      console.log(
        "[DEBUG] Wallet is premium and profile ID provided - validating ownership"
      );
      // Validate ownership of provided profile before allowing link
      let ownsProfile = false;
      try {
        ownsProfile = await profileService.validateProfileOwnership(
          normalizedAddress,
          normalizedProfileId
        );
        console.log(
          `[DEBUG] Profile ownership validation result (ownsProfile): ${ownsProfile}`
        );
      } catch (error) {
        console.error(
          "[DEBUG] ERROR during profile ownership validation:",
          error
        );
      }

      if (ownsProfile) {
        console.log(
          "[DEBUG] Profile ownership validation PASSED - checking for existing links"
        );
        // Check if this wallet was previously linked to another profile
        let existingPremiumProfile = null;
        try {
          existingPremiumProfile = await prisma.premiumProfile.findFirst({
            where: {
              isActive: true, // Only look for active links
              walletAddress: normalizedAddress
            }
          });
          console.log(
            "[DEBUG] Existing premium profile check:",
            existingPremiumProfile
          );
        } catch (error) {
          console.error(
            "[DEBUG] ERROR during existing premium profile check:",
            error
          );
        }

        if (existingPremiumProfile) {
          console.log(
            "[DEBUG] Wallet was previously linked to another profile - REJECTION case"
          );
          // Wallet was previously linked to another profile - this profile is rejected
          finalResponse = {
            canLink: false,
            canRegisterPremium: false,
            message:
              "Your premium wallet is already connected to another one of your Lens profiles and is premium. You are not allowed to make this profile premium.",
            userStatus: "Standard"
          };
        } else {
          console.log(
            "[DEBUG] Wallet is premium, owns profile, never linked - CAN LINK case"
          );
          // Premium wallet, never linked, owns profile - can link
          finalResponse = {
            canLink: true,
            canRegisterPremium: false,
            message:
              "Premium wallet detected. You can link this profile to become premium.",
            userStatus: "Standard"
          };
        }
      } else {
        console.log(
          "[DEBUG] Profile ownership validation FAILED - REJECTION case"
        );
        finalResponse = {
          canLink: false,
          canRegisterPremium: false,
          message: "Connected wallet does not own this Lens profile.",
          userStatus: "Standard"
        };
      }
    } else {
      console.log(
        "[DEBUG] Wallet is premium but no profile ID provided - CAN LINK case"
      );
      // No profile connected yet (e.g., Scenario 1 before first profile exists)
      finalResponse = {
        canLink: true,
        canRegisterPremium: false,
        message:
          "Premium wallet detected. Connect a Lens profile to finalize premium linkage.",
        userStatus: "Standard"
      };
    }

    console.log("[DEBUG] Final response being sent:", finalResponse);
    console.log("--- [DEBUG] Ending determineStatus ---\n");
    return finalResponse;
  }

  /**
   * Explicit permanent link endpoint for clients that separate status-check and link actions.
   * Enforces: wallet must be premium, no existing link, profile must be owned.
   */
  async linkProfile(
    walletAddress: string,
    profileId: string
  ): Promise<{
    linkedProfileId: string;
    userStatus: "Premium";
  }> {
    const normalizedAddress = this.normalizeWalletAddress(walletAddress);
    const normalizedProfileId = profileId.toLowerCase();

    const isPremium =
      await BlockchainService.isWalletPremium(normalizedAddress);
    if (!isPremium) {
      throw new Error("Wallet is not premium (not in NodeSet)");
    }

    const existingLink = await prisma.premiumProfile.findFirst({
      where: {
        isActive: true, // Only look for active links
        walletAddress: normalizedAddress
      }
    });
    if (existingLink) {
      const error: any = new Error(
        "Wallet already has a linked premium profile. Linking is permanent and cannot be changed."
      );
      error.code = "LINK_ALREADY_EXISTS";
      error.walletAddress = normalizedAddress;
      error.linkedProfileId = existingLink.profileId;
      throw error;
    }

    const ownsProfile = await profileService.validateProfileOwnership(
      normalizedAddress,
      normalizedProfileId
    );
    if (!ownsProfile) {
      throw new Error("Profile is not owned by the provided wallet address");
    }

    const link = await prisma.premiumProfile.create({
      data: {
        isActive: true,
        linkedAt: new Date(),
        profileId: normalizedProfileId,
        walletAddress: normalizedAddress
      }
    });

    logger.info(
      `Permanent premium link established via explicit call: wallet=${normalizedAddress} profile=${normalizedProfileId}`
    );

    return { linkedProfileId: link.profileId, userStatus: "Premium" };
  }
}

export default new PremiumV2Service();
