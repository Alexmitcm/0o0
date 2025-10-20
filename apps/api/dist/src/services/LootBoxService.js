"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveLootBoxes = getActiveLootBoxes;
exports.getLootBoxById = getLootBoxById;
exports.canUserOpenLootBox = canUserOpenLootBox;
exports.openLootBox = openLootBox;
exports.getUserLootBoxHistory = getUserLootBoxHistory;
exports.getUserCooldownStatus = getUserCooldownStatus;
exports.getUserDailyLimitStatus = getUserDailyLimitStatus;
exports.createLootBox = createLootBox;
exports.addRewardToLootBox = addRewardToLootBox;
exports.updateLootBox = updateLootBox;
exports.deleteLootBox = deleteLootBox;
exports.getLootBoxStats = getLootBoxStats;
const crypto = __importStar(require("node:crypto"));
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
const CoinService_1 = require("./CoinService");
// Get all active loot boxes
async function getActiveLootBoxes() {
    try {
        const lootBoxes = await client_1.default.lootBox.findMany({
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
    }
    catch (error) {
        logger_1.default.error("Error getting active loot boxes:", error);
        throw error;
    }
}
// Get loot box by ID
async function getLootBoxById(id) {
    try {
        const lootBox = await client_1.default.lootBox.findUnique({
            include: {
                rewards: {
                    orderBy: { probability: "desc" },
                    where: { isActive: true }
                }
            },
            where: { id }
        });
        return lootBox;
    }
    catch (error) {
        logger_1.default.error("Error getting loot box by ID:", error);
        throw error;
    }
}
// Check if user can open loot box
async function canUserOpenLootBox(walletAddress, lootBoxId) {
    try {
        const lootBox = await client_1.default.lootBox.findUnique({
            where: { id: lootBoxId }
        });
        if (!lootBox || !lootBox.isActive) {
            return { canOpen: false, reason: "Loot box is not available" };
        }
        // Check if user has premium access for premium loot boxes
        if (lootBox.requiresPremium) {
            const user = await client_1.default.user.findUnique({
                include: { premiumProfile: true },
                where: { walletAddress }
            });
            if (!user?.premiumProfile?.isActive) {
                return { canOpen: false, reason: "Premium subscription required" };
            }
        }
        // Check cooldown
        const cooldown = await client_1.default.lootBoxCooldown.findUnique({
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
            const dailyLimit = await client_1.default.lootBoxDailyLimit.findUnique({
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
    }
    catch (error) {
        logger_1.default.error("Error checking if user can open loot box:", error);
        throw error;
    }
}
// Open loot box
async function openLootBox(walletAddress, lootBoxId, adData, requestInfo) {
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
        const lootBoxOpen = await client_1.default.lootBoxOpen.create({
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
        const rewardRecords = await Promise.all(rewards.map((reward) => client_1.default.lootBoxOpenReward.create({
            data: {
                claimedAt: reward.claimed ? new Date() : null,
                lootBoxOpenId: lootBoxOpen.id,
                rewardId: reward.rewardId,
                rewardType: reward.type,
                rewardValue: JSON.stringify(reward.value)
            }
        })));
        // Update cooldown
        const nextAvailableAt = new Date();
        nextAvailableAt.setMinutes(nextAvailableAt.getMinutes() + lootBox.cooldownMinutes);
        await client_1.default.lootBoxCooldown.upsert({
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
            await client_1.default.lootBoxDailyLimit.upsert({
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
    }
    catch (error) {
        logger_1.default.error("Error opening loot box:", error);
        throw error;
    }
}
// Generate rewards based on loot box configuration
async function generateRewards(lootBoxId, walletAddress) {
    const lootBox = await client_1.default.lootBox.findUnique({
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
    const rewards = [];
    // For free loot boxes, always give coins
    if (lootBox.type === "Free") {
        const coinAmount = getRandomCoinAmount(lootBox.minCoinReward, lootBox.maxCoinReward);
        // Award coins to user
        await CoinService_1.CoinService.awardCoins({
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
    }
    else {
        // For premium loot boxes, use probability-based rewards
        for (const rewardConfig of lootBox.rewards) {
            if (Math.random() < rewardConfig.probability) {
                const rewardValue = JSON.parse(rewardConfig.rewardValue);
                const claimed = await processReward(walletAddress, rewardValue, lootBoxId);
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
async function processReward(walletAddress, rewardValue, lootBoxId) {
    try {
        switch (rewardValue.type) {
            case "coins":
                await CoinService_1.CoinService.awardCoins({
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
                // TODO: Implement NFT transfer logic
                // This would involve calling the NFT contract to transfer the token
                logger_1.default.info(`NFT reward: ${rewardValue.nftId} for user ${walletAddress}`);
                return false; // Not claimed until NFT is actually transferred
            case "crypto":
                // TODO: Implement crypto transfer logic
                // This would involve calling the crypto contract to transfer tokens
                logger_1.default.info(`Crypto reward: ${rewardValue.amount} ${rewardValue.symbol} for user ${walletAddress}`);
                return false; // Not claimed until crypto is actually transferred
            case "experience":
                await CoinService_1.CoinService.awardCoins({
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
                await CoinService_1.CoinService.awardCoins({
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
                logger_1.default.warn(`Unknown reward type: ${rewardValue.type}`);
                return false;
        }
    }
    catch (error) {
        logger_1.default.error("Error processing reward:", error);
        return false;
    }
}
// Get random coin amount within range
function getRandomCoinAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Get user's loot box history
async function getUserLootBoxHistory(walletAddress, limit = 50, offset = 0) {
    try {
        const history = await client_1.default.lootBoxOpen.findMany({
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
    }
    catch (error) {
        logger_1.default.error("Error getting user loot box history:", error);
        throw error;
    }
}
// Get user's cooldown status for all loot boxes
async function getUserCooldownStatus(walletAddress) {
    try {
        const cooldowns = await client_1.default.lootBoxCooldown.findMany({
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
    }
    catch (error) {
        logger_1.default.error("Error getting user cooldown status:", error);
        throw error;
    }
}
// Get user's daily limit status
async function getUserDailyLimitStatus(walletAddress) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyLimits = await client_1.default.lootBoxDailyLimit.findMany({
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
    }
    catch (error) {
        logger_1.default.error("Error getting user daily limit status:", error);
        throw error;
    }
}
// Admin: Create loot box
async function createLootBox(data) {
    try {
        const lootBox = await client_1.default.lootBox.create({
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
                type: data.type
            }
        });
        return lootBox;
    }
    catch (error) {
        logger_1.default.error("Error creating loot box:", error);
        throw error;
    }
}
// Admin: Add reward to loot box
async function addRewardToLootBox(lootBoxId, rewardType, rewardValue, probability) {
    try {
        const reward = await client_1.default.lootBoxReward.create({
            data: {
                lootBoxId,
                probability: Math.max(0, Math.min(1, probability)),
                rewardType: rewardType,
                rewardValue: JSON.stringify(rewardValue)
            }
        });
        return reward;
    }
    catch (error) {
        logger_1.default.error("Error adding reward to loot box:", error);
        throw error;
    }
}
// Admin: Update loot box
async function updateLootBox(id, data) {
    try {
        const lootBox = await client_1.default.lootBox.update({
            data: {
                ...data,
                updatedAt: new Date()
            },
            where: { id }
        });
        return lootBox;
    }
    catch (error) {
        logger_1.default.error("Error updating loot box:", error);
        throw error;
    }
}
// Admin: Delete loot box
async function deleteLootBox(id) {
    try {
        await client_1.default.lootBox.update({
            data: { isActive: false },
            where: { id }
        });
        return { success: true };
    }
    catch (error) {
        logger_1.default.error("Error deleting loot box:", error);
        throw error;
    }
}
// Admin: Get loot box statistics
async function getLootBoxStats(lootBoxId) {
    try {
        const stats = await client_1.default.lootBoxOpen.aggregate({
            _count: { id: true },
            where: { lootBoxId }
        });
        const recentOpens = await client_1.default.lootBoxOpen.count({
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
    }
    catch (error) {
        logger_1.default.error("Error getting loot box stats:", error);
        throw error;
    }
}
