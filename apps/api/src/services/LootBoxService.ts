import * as crypto from "node:crypto";
import prisma from "../prisma/client";
import logger from "../utils/logger";
import { CoinService } from "./CoinService";

export interface LootBoxRewardData {
  type: "coins" | "nft" | "crypto" | "experience" | "achievement";
  value: any;
  metadata?: any;
}

export interface LootBoxOpenResult {
  success: boolean;
  rewards: LootBoxOpenReward[];
  nextAvailableAt?: Date;
  error?: string;
}

export interface LootBoxOpenReward {
  id: string;
  rewardId: string;
  type: string;
  value: any;
  claimed: boolean;
  claimedAt?: Date;
}

// Get all active loot boxes
export async function getActiveLootBoxes() {
  try {
    const lootBoxes = await prisma.lootBox.findMany({
      include: {
        rewards: {
          orderBy: { probability: "desc" },
          where: { isActive: true }
        }
      },
      orderBy: { createdAt: "desc" },
      where: { isActive: true }
    });

    return lootBoxes;
  } catch (error) {
    logger.error("Error getting active loot boxes:", error);
    throw error;
  }
}

// Get loot box by ID
export async function getLootBoxById(id: string) {
  try {
    const lootBox = await prisma.lootBox.findUnique({
      include: {
        rewards: {
          orderBy: { probability: "desc" },
          where: { isActive: true }
        }
      },
      where: { id }
    });

    return lootBox;
  } catch (error) {
    logger.error("Error getting loot box by ID:", error);
    throw error;
  }
}

// Check if user can open loot box
export async function canUserOpenLootBox(
  walletAddress: string,
  lootBoxId: string
): Promise<{
  canOpen: boolean;
  reason?: string;
  nextAvailableAt?: Date;
}> {
  try {
    const lootBox = await prisma.lootBox.findUnique({
      where: { id: lootBoxId }
    });

    if (!lootBox || !lootBox.isActive) {
      return { canOpen: false, reason: "Loot box is not available" };
    }

    // Check if user has premium access for premium loot boxes
    if (lootBox.requiresPremium) {
      const user = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress }
      });

      if (!user?.premiumProfile?.isActive) {
        return { canOpen: false, reason: "Premium subscription required" };
      }
    }

    // Check cooldown
    const cooldown = await prisma.lootBoxCooldown.findUnique({
      where: {
        walletAddress_lootBoxId: {
          lootBoxId,
          walletAddress
        }
      }
    });

    if (cooldown && cooldown.nextAvailableAt > new Date()) {
      return {
        canOpen: false,
        nextAvailableAt: cooldown.nextAvailableAt,
        reason: "Loot box is on cooldown"
      };
    }

    // Check daily limit
    if (lootBox.maxOpensPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyLimit = await prisma.lootBoxDailyLimit.findUnique({
        where: {
          walletAddress_lootBoxId_date: {
            date: today,
            lootBoxId,
            walletAddress
          }
        }
      });

      if (dailyLimit && dailyLimit.openCount >= lootBox.maxOpensPerDay) {
        return { canOpen: false, reason: "Daily limit reached" };
      }
    }

    return { canOpen: true };
  } catch (error) {
    logger.error("Error checking if user can open loot box:", error);
    throw error;
  }
}

// Open loot box
export async function openLootBox(
  walletAddress: string,
  lootBoxId: string,
  adData?: {
    adWatched: boolean;
    adProvider?: string;
    adPlacementId?: string;
    adRewardId?: string;
  },
  requestInfo?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<LootBoxOpenResult> {
  try {
    // Check if user can open loot box
    const canOpen = await canUserOpenLootBox(walletAddress, lootBoxId);
    if (!canOpen.canOpen) {
      return {
        error: canOpen.reason,
        nextAvailableAt: canOpen.nextAvailableAt,
        rewards: [],
        success: false
      };
    }

    const lootBox = await getLootBoxById(lootBoxId);
    if (!lootBox) {
      return {
        error: "Loot box not found",
        rewards: [],
        success: false
      };
    }

    // For free loot boxes, verify ad was watched
    if (lootBox.adRequired && (!adData?.adWatched || !adData?.adProvider)) {
      return {
        error: "Ad must be watched to open this loot box",
        rewards: [],
        success: false
      };
    }

    // Generate rewards based on probabilities
    const rewards = await generateRewards(lootBoxId, walletAddress);

    // Create loot box open record
    const lootBoxOpen = await prisma.lootBoxOpen.create({
      data: {
        adPlacementId: adData?.adPlacementId,
        adProvider: adData?.adProvider,
        adRewardId: adData?.adRewardId,
        adWatched: adData?.adWatched || false,
        ipAddress: requestInfo?.ipAddress,
        lootBoxId,
        sessionId: requestInfo?.sessionId,
        userAgent: requestInfo?.userAgent,
        walletAddress
      }
    });

    // Create reward records
    const rewardRecords = await Promise.all(
      rewards.map((reward) =>
        prisma.lootBoxOpenReward.create({
          data: {
            claimedAt: reward.claimed ? new Date() : null,
            lootBoxOpenId: lootBoxOpen.id,
            rewardId: reward.rewardId,
            rewardType: reward.type as any,
            rewardValue: JSON.stringify(reward.value)
          }
        })
      )
    );

    // Update cooldown
    const nextAvailableAt = new Date();
    nextAvailableAt.setMinutes(
      nextAvailableAt.getMinutes() + lootBox.cooldownMinutes
    );

    await prisma.lootBoxCooldown.upsert({
      create: {
        lastOpenedAt: new Date(),
        lootBoxId,
        nextAvailableAt,
        walletAddress
      },
      update: {
        lastOpenedAt: new Date(),
        nextAvailableAt
      },
      where: {
        walletAddress_lootBoxId: {
          lootBoxId,
          walletAddress
        }
      }
    });

    // Update daily limit
    if (lootBox.maxOpensPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.lootBoxDailyLimit.upsert({
        create: {
          date: today,
          lootBoxId,
          openCount: 1,
          walletAddress
        },
        update: {
          openCount: { increment: 1 }
        },
        where: {
          walletAddress_lootBoxId_date: {
            date: today,
            lootBoxId,
            walletAddress
          }
        }
      });
    }

    return {
      nextAvailableAt,
      rewards: rewardRecords.map((record) => ({
        claimed: !!record.claimedAt,
        claimedAt: record.claimedAt || undefined,
        id: record.id,
        rewardId: record.rewardId,
        type: record.rewardType,
        value: JSON.parse(record.rewardValue)
      })),
      success: true
    };
  } catch (error) {
    logger.error("Error opening loot box:", error);
    throw error;
  }
}

// Generate rewards based on loot box configuration
async function generateRewards(
  lootBoxId: string,
  walletAddress: string
): Promise<LootBoxOpenReward[]> {
  const lootBox = await prisma.lootBox.findUnique({
    include: {
      rewards: {
        orderBy: { probability: "desc" },
        where: { isActive: true }
      }
    },
    where: { id: lootBoxId }
  });

  if (!lootBox) {
    throw new Error("Loot box not found");
  }

  const rewards: LootBoxOpenReward[] = [];

  // For free loot boxes, always give coins
  if (lootBox.type === "Free") {
      const coinAmount = getRandomCoinAmount(
      lootBox.minCoinReward,
      lootBox.maxCoinReward
    );

    // Award coins to user
    await CoinService.awardCoins({
      amount: coinAmount,
      coinType: lootBox.coinType,
      description: `Loot box reward: ${coinAmount} ${lootBox.coinType} coins`,
      sourceId: lootBoxId,
      sourceMetadata: {
        lootBoxName: lootBox.name,
        lootBoxType: lootBox.type
      },
      sourceType: "LootBox",
      walletAddress
    });

    rewards.push({
      claimed: true,
      id: crypto.randomUUID(),
      type: "coins",
      value: {
        amount: coinAmount,
        coinType: lootBox.coinType
      }
    });
  } else {
    // For premium loot boxes, use probability-based rewards
    for (const rewardConfig of lootBox.rewards) {
      if (Math.random() < rewardConfig.probability) {
        const rewardValue = JSON.parse(rewardConfig.rewardValue);
          const claimed = await processReward(
          walletAddress,
          rewardValue,
          lootBoxId
        );

        rewards.push({
          claimed,
          id: crypto.randomUUID(),
          type: rewardConfig.rewardType,
          value: rewardValue
        });
      }
    }
  }

  return rewards;
}

// Process different types of rewards
async function processReward(
  walletAddress: string,
  rewardValue: any,
  lootBoxId: string
): Promise<boolean> {
  try {
    switch (rewardValue.type) {
      case "coins":
        await CoinService.awardCoins({
          amount: rewardValue.amount,
          coinType: rewardValue.coinType,
          description: `Loot box reward: ${rewardValue.amount} ${rewardValue.coinType} coins`,
          sourceId: lootBoxId,
          sourceMetadata: {
            amount: rewardValue.amount,
            rewardType: "coins"
          },
          sourceType: "LootBox",
          walletAddress
        });
        return true;

      case "nft":
        // NFT transfer logic would be implemented here
        // This would involve calling the NFT contract to transfer the token
        logger.info(
          `NFT reward: ${rewardValue.nftId} for user ${walletAddress}`
        );
        return false; // Not claimed until NFT is actually transferred

      case "crypto":
        // Crypto transfer logic would be implemented here
        // This would involve calling the crypto contract to transfer tokens
        logger.info(
          `Crypto reward: ${rewardValue.amount} ${rewardValue.symbol} for user ${walletAddress}`
        );
        return false; // Not claimed until crypto is actually transferred

      case "experience":
        await CoinService.awardCoins({
          amount: rewardValue.amount,
          coinType: "Experience",
          description: `Loot box reward: ${rewardValue.amount} experience points`,
          sourceId: lootBoxId,
          sourceMetadata: {
            amount: rewardValue.amount,
            rewardType: "experience"
          },
          sourceType: "LootBox",
          walletAddress
        });
        return true;

      case "achievement":
        await CoinService.awardCoins({
          amount: rewardValue.amount,
          coinType: "Achievement",
          description: `Loot box reward: ${rewardValue.amount} achievement points`,
          sourceId: lootBoxId,
          sourceMetadata: {
            amount: rewardValue.amount,
            rewardType: "achievement"
          },
          sourceType: "LootBox",
          walletAddress
        });
        return true;

      default:
        logger.warn(`Unknown reward type: ${rewardValue.type}`);
        return false;
    }
  } catch (error) {
    logger.error("Error processing reward:", error);
    return false;
  }
}

// Get random coin amount within range
function getRandomCoinAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get user's loot box history
export async function getUserLootBoxHistory(
  walletAddress: string,
  limit = 50,
  offset = 0
) {
  try {
    const history = await prisma.lootBoxOpen.findMany({
      include: {
        lootBox: true,
        rewards: {
          include: {
            reward: true
          }
        }
      },
      orderBy: { openedAt: "desc" },
      skip: offset,
      take: limit,
      where: { walletAddress }
    });

    return history;
  } catch (error) {
    logger.error("Error getting user loot box history:", error);
    throw error;
  }
}

// Get user's cooldown status for all loot boxes
export async function getUserCooldownStatus(walletAddress: string) {
  try {
    const cooldowns = await prisma.lootBoxCooldown.findMany({
      include: {
        lootBox: true
      },
      where: { walletAddress }
    });

    return cooldowns.map((cooldown) => ({
      isAvailable: cooldown.nextAvailableAt <= new Date(),
      lootBoxId: cooldown.lootBoxId,
      lootBoxName: cooldown.lootBox.name,
      nextAvailableAt: cooldown.nextAvailableAt
    }));
  } catch (error) {
    logger.error("Error getting user cooldown status:", error);
    throw error;
  }
}

// Get user's daily limit status
export async function getUserDailyLimitStatus(walletAddress: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLimits = await prisma.lootBoxDailyLimit.findMany({
      include: {
        lootBox: true
      },
      where: {
        date: today,
        walletAddress
      }
    });

    return dailyLimits.map((limit) => ({
      lootBoxId: limit.lootBoxId,
      lootBoxName: limit.lootBox.name,
      maxOpens: limit.lootBox.maxOpensPerDay,
      openCount: limit.openCount,
      remaining: limit.lootBox.maxOpensPerDay
        ? Math.max(0, limit.lootBox.maxOpensPerDay - limit.openCount)
        : null
    }));
  } catch (error) {
    logger.error("Error getting user daily limit status:", error);
    throw error;
  }
}

// Admin: Create loot box
export async function createLootBox(data: {
  name: string;
  description?: string;
  type: "Free" | "Premium";
  cooldownMinutes: number;
  maxOpensPerDay?: number;
  adRequired?: boolean;
  adProvider?: string;
  adPlacementId?: string;
  requiresPremium?: boolean;
  minCoinReward?: number;
  maxCoinReward?: number;
  coinType?: "Experience" | "Achievement" | "Social" | "Premium";
}) {
  try {
    const lootBox = await prisma.lootBox.create({
      data: {
        adPlacementId: data.adPlacementId,
        adProvider: data.adProvider,
        adRequired: data.adRequired || false,
        coinType: data.coinType || "Experience",
        cooldownMinutes: data.cooldownMinutes,
        description: data.description,
        maxCoinReward: data.maxCoinReward || 100,
        maxOpensPerDay: data.maxOpensPerDay,
        minCoinReward: data.minCoinReward || 10,
        name: data.name,
        requiresPremium: data.requiresPremium || false,
        type: data.type as any
      }
    });

    return lootBox;
  } catch (error) {
    logger.error("Error creating loot box:", error);
    throw error;
  }
}

// Admin: Add reward to loot box
export async function addRewardToLootBox(
  lootBoxId: string,
  rewardType: "Coins" | "NFT" | "Crypto" | "Experience" | "Achievement",
  rewardValue: any,
  probability: number
) {
  try {
    const reward = await prisma.lootBoxReward.create({
      data: {
        lootBoxId,
        probability: Math.max(0, Math.min(1, probability)),
        rewardType: rewardType as any,
        rewardValue: JSON.stringify(rewardValue)
      }
    });

    return reward;
  } catch (error) {
    logger.error("Error adding reward to loot box:", error);
    throw error;
  }
}

// Admin: Update loot box
export async function updateLootBox(id: string, data: any) {
  try {
    const lootBox = await prisma.lootBox.update({
      data: {
        ...data,
        updatedAt: new Date()
      },
      where: { id }
    });

    return lootBox;
  } catch (error) {
    logger.error("Error updating loot box:", error);
    throw error;
  }
}

// Admin: Delete loot box
export async function deleteLootBox(id: string) {
  try {
    await prisma.lootBox.update({
      data: { isActive: false },
      where: { id }
    });

    return { success: true };
  } catch (error) {
    logger.error("Error deleting loot box:", error);
    throw error;
  }
}

// Admin: Get loot box statistics
export async function getLootBoxStats(lootBoxId: string) {
  try {
    const stats = await prisma.lootBoxOpen.aggregate({
      _count: { id: true },
      where: { lootBoxId }
    });

    const recentOpens = await prisma.lootBoxOpen.count({
      where: {
        lootBoxId,
        openedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return {
      opensLast24h: recentOpens,
      totalOpens: stats._count.id
    };
  } catch (error) {
    logger.error("Error getting loot box stats:", error);
    throw error;
  }
}
