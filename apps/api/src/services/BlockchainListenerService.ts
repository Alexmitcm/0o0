import { createPublicClient, parseAbiItem, webSocket } from "viem";
import { arbitrum } from "viem/chains";
import prisma from "../prisma/client";
import logger from "../utils/logger";

/**
 * BlockchainListenerService
 * Listens to Referral contract Register events over WebSocket and
 * updates local DB user status to Premium in real-time.
 */
class BlockchainListenerService {
  private unwatch: null | (() => void) = null;

  private getReferralAddress(): `0x${string}` {
    const addr = process.env.REFERRAL_CONTRACT_ADDRESS;
    if (!addr) {
      throw new Error("REFERRAL_CONTRACT_ADDRESS not set");
    }
    return addr as `0x${string}`;
  }

  private getWebSocketUrl(): string | null {
    // Prefer explicit INFURA_WS_URL; fall back to INFURA_URL if it looks ws(s)://
    const ws = process.env.INFURA_WS_URL;
    if (ws?.startsWith("ws")) return ws;
    const httpUrl = process.env.INFURA_URL;
    if (httpUrl?.startsWith("ws")) return httpUrl;
    return null;
  }

  async updateUserToPremium(walletAddress: string): Promise<void> {
    const normalized = walletAddress.toLowerCase();
    try {
      const user = await prisma.user.findUnique({
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

      await prisma.user.update({
        data: { premiumUpgradedAt: new Date(), status: "Premium" },
        where: { walletAddress: normalized }
      });

      logger.info(
        `[Listener] Upgraded user to Premium via on-chain event: ${normalized}`
      );
    } catch (error) {
      logger.error(
        `[Listener] Failed to update user to Premium for ${normalized}:`,
        error
      );
    }
  }

  start(): void {
    if (this.unwatch) {
      return; // already started
    }

    const wsUrl = this.getWebSocketUrl();
    if (!wsUrl) {
      logger.warn(
        "[Listener] INFURA_WS_URL not set (or not ws://). Skipping blockchain event listener."
      );
      return;
    }

    try {
      const client = createPublicClient({
        chain: arbitrum,
        transport: webSocket(wsUrl)
      });

      const referralAddress = this.getReferralAddress();

      // Minimal ABI for the Register event; adjust names if your contract differs
      const REGISTER_EVENT_ABI = [
        parseAbiItem(
          "event Register(address indexed player, address indexed referrer)"
        )
      ];

      logger.info("[Listener] Starting watchContractEvent for Register...");
      this.unwatch = client.watchContractEvent({
        abi: REGISTER_EVENT_ABI,
        address: referralAddress,
        eventName: "Register",
        onError: (err) => {
          logger.error("[Listener] Error in watchContractEvent:", err);
        },
        onLogs: async (logs) => {
          try {
            for (const log of logs) {
              // viem decodes args based on ABI; expect player/referrer
              const args: any = (log as any).args || {};
              const player: string =
                args.player || args.user || args.account || args[0];
              if (!player) {
                logger.warn("[Listener] Register log without player arg", log);
                continue;
              }
              await this.updateUserToPremium(player);
            }
          } catch (error) {
            logger.error("[Listener] Error processing logs:", error);
          }
        }
      });
    } catch (error) {
      logger.error("[Listener] Failed to start blockchain listener:", error);
    }
  }

  stop(): void {
    if (this.unwatch) {
      try {
        this.unwatch();
        logger.info("[Listener] Stopped blockchain event listener.");
      } catch {
        // noop
      } finally {
        this.unwatch = null;
      }
    }
  }
}

export default new BlockchainListenerService();
