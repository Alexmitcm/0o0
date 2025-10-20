"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
class CoinService {
    /**
     * Award coins to a user
     */
    static async awardCoins(data) {
        try {
            const { walletAddress, coinType, amount, sourceType, sourceId, sourceMetadata, description } = data;
            if (amount <= 0) {
                throw new Error("Amount must be positive");
            }
            // Start transaction
            const result = await client_1.default.$transaction(async (tx) => {
                // Create coin record
                const coinRecord = await tx.userCoin.create({
                    data: {
                        amount,
                        coinType,
                        sourceId,
                        sourceMetadata,
                        sourceType,
                        walletAddress
                    }
                });
                // Get or create user balance
                let userBalance = await tx.userCoinBalance.findUnique({
                    where: { walletAddress }
                });
                if (!userBalance) {
                    userBalance = await tx.userCoinBalance.create({
                        data: {
                            achievementCoins: 0,
                            experienceCoins: 0,
                            premiumCoins: 0,
                            socialCoins: 0,
                            totalCoins: 0,
                            walletAddress
                        }
                    });
                }
                // Update balance
                const balanceBefore = userBalance[`${coinType.toLowerCase()}Coins`];
                const balanceAfter = balanceBefore + amount;
                const updatedBalance = await tx.userCoinBalance.update({
                    data: {
                        totalCoins: userBalance.totalCoins + amount,
                        [`${coinType.toLowerCase()}Coins`]: balanceAfter,
                        lastUpdatedAt: new Date()
                    },
                    where: { walletAddress }
                });
                // Create transaction record
                await tx.coinTransaction.create({
                    data: {
                        amount,
                        balanceAfter,
                        balanceBefore,
                        coinType,
                        description,
                        sourceId,
                        sourceMetadata,
                        sourceType,
                        transactionType: "Earned",
                        walletAddress
                    }
                });
                return { coinRecord, updatedBalance };
            });
            logger_1.default.info(`Awarded ${amount} ${coinType} coins to ${walletAddress}`, {
                amount,
                coinType,
                sourceId,
                sourceType,
                walletAddress
            });
            return true;
        }
        catch (error) {
            logger_1.default.error("Error awarding coins:", error);
            throw error;
        }
    }
    /**
     * Get user's coin balance
     */
    static async getUserBalance(walletAddress) {
        try {
            const balance = await client_1.default.userCoinBalance.findUnique({
                where: { walletAddress }
            });
            if (!balance) {
                return null;
            }
            return {
                achievementCoins: balance.achievementCoins,
                experienceCoins: balance.experienceCoins,
                lastUpdatedAt: balance.lastUpdatedAt,
                premiumCoins: balance.premiumCoins,
                socialCoins: balance.socialCoins,
                totalCoins: balance.totalCoins
            };
        }
        catch (error) {
            logger_1.default.error("Error getting user balance:", error);
            throw error;
        }
    }
    /**
     * Get user's coin transaction history
     */
    static async getUserTransactions(walletAddress, limit = 50, offset = 0, coinType) {
        try {
            const transactions = await client_1.default.coinTransaction.findMany({
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
                where: {
                    walletAddress,
                    ...(coinType && { coinType })
                }
            });
            return transactions.map((tx) => ({
                amount: tx.amount,
                balanceAfter: tx.balanceAfter,
                balanceBefore: tx.balanceBefore,
                coinType: tx.coinType,
                createdAt: tx.createdAt,
                description: tx.description,
                id: tx.id,
                sourceId: tx.sourceId,
                sourceMetadata: tx.sourceMetadata,
                sourceType: tx.sourceType,
                transactionType: tx.transactionType
            }));
        }
        catch (error) {
            logger_1.default.error("Error getting user transactions:", error);
            throw error;
        }
    }
    /**
     * Get user's coin earning history by source
     */
    static async getUserCoinHistory(walletAddress, limit = 50, offset = 0) {
        try {
            const coins = await client_1.default.userCoin.findMany({
                include: {
                    user: {
                        select: {
                            avatarUrl: true,
                            displayName: true,
                            username: true
                        }
                    }
                },
                orderBy: { earnedAt: "desc" },
                skip: offset,
                take: limit,
                where: { walletAddress }
            });
            return coins.map((coin) => ({
                amount: coin.amount,
                coinType: coin.coinType,
                earnedAt: coin.earnedAt,
                id: coin.id,
                sourceId: coin.sourceId,
                sourceMetadata: coin.sourceMetadata,
                sourceType: coin.sourceType,
                user: coin.user
            }));
        }
        catch (error) {
            logger_1.default.error("Error getting user coin history:", error);
            throw error;
        }
    }
    /**
     * Spend coins from user's balance
     */
    static async spendCoins(walletAddress, coinType, amount, sourceType, sourceId, sourceMetadata, description) {
        try {
            if (amount <= 0) {
                throw new Error("Amount must be positive");
            }
            const result = await client_1.default.$transaction(async (tx) => {
                // Get current balance
                const userBalance = await tx.userCoinBalance.findUnique({
                    where: { walletAddress }
                });
                if (!userBalance) {
                    throw new Error("User balance not found");
                }
                const currentBalance = userBalance[`${coinType.toLowerCase()}Coins`];
                if (currentBalance < amount) {
                    throw new Error("Insufficient coin balance");
                }
                // Update balance
                const balanceAfter = currentBalance - amount;
                await tx.userCoinBalance.update({
                    data: {
                        totalCoins: userBalance.totalCoins - amount,
                        [`${coinType.toLowerCase()}Coins`]: balanceAfter,
                        lastUpdatedAt: new Date()
                    },
                    where: { walletAddress }
                });
                // Create transaction record
                await tx.coinTransaction.create({
                    data: {
                        amount: -amount, // Negative for spending
                        balanceAfter,
                        balanceBefore: currentBalance,
                        coinType,
                        description,
                        sourceId,
                        sourceMetadata,
                        sourceType,
                        transactionType: "Spent",
                        walletAddress
                    }
                });
                return true;
            });
            logger_1.default.info(`Spent ${amount} ${coinType} coins from ${walletAddress}`, {
                amount,
                coinType,
                sourceId,
                sourceType,
                walletAddress
            });
            return true;
        }
        catch (error) {
            logger_1.default.error("Error spending coins:", error);
            throw error;
        }
    }
    /**
     * Admin adjustment of user coins
     */
    static async adjustCoins(walletAddress, coinType, amount, reason, adminWalletAddress) {
        try {
            const result = await client_1.default.$transaction(async (tx) => {
                // Get or create user balance
                let userBalance = await tx.userCoinBalance.findUnique({
                    where: { walletAddress }
                });
                if (!userBalance) {
                    userBalance = await tx.userCoinBalance.create({
                        data: {
                            achievementCoins: 0,
                            experienceCoins: 0,
                            premiumCoins: 0,
                            socialCoins: 0,
                            totalCoins: 0,
                            walletAddress
                        }
                    });
                }
                const balanceBefore = userBalance[`${coinType.toLowerCase()}Coins`];
                const balanceAfter = balanceBefore + amount;
                // Update balance
                await tx.userCoinBalance.update({
                    data: {
                        totalCoins: userBalance.totalCoins + amount,
                        [`${coinType.toLowerCase()}Coins`]: balanceAfter,
                        lastUpdatedAt: new Date()
                    },
                    where: { walletAddress }
                });
                // Create transaction record
                await tx.coinTransaction.create({
                    data: {
                        amount,
                        balanceAfter,
                        balanceBefore,
                        coinType,
                        description: `Admin adjustment: ${reason}`,
                        sourceId: adminWalletAddress,
                        sourceMetadata: { adminWalletAddress, reason },
                        sourceType: "Admin",
                        transactionType: "AdminAdjustment",
                        walletAddress
                    }
                });
                return true;
            });
            logger_1.default.info(`Admin adjusted ${amount} ${coinType} coins for ${walletAddress}`, {
                adminWalletAddress,
                amount,
                coinType,
                reason,
                walletAddress
            });
            return true;
        }
        catch (error) {
            logger_1.default.error("Error adjusting coins:", error);
            throw error;
        }
    }
    /**
     * Get top users by coin balance
     */
    static async getTopUsersByCoins(limit = 100, coinType) {
        try {
            const orderBy = coinType
                ? { [`${coinType.toLowerCase()}Coins`]: "desc" }
                : { totalCoins: "desc" };
            const users = await client_1.default.userCoinBalance.findMany({
                include: {
                    user: {
                        select: {
                            avatarUrl: true,
                            displayName: true,
                            status: true,
                            username: true,
                            walletAddress: true
                        }
                    }
                },
                orderBy,
                take: limit
            });
            return users.map((user, index) => ({
                achievementCoins: user.achievementCoins,
                avatarUrl: user.user.avatarUrl,
                displayName: user.user.displayName,
                experienceCoins: user.experienceCoins,
                lastUpdatedAt: user.lastUpdatedAt,
                premiumCoins: user.premiumCoins,
                rank: index + 1,
                socialCoins: user.socialCoins,
                status: user.user.status,
                totalCoins: user.totalCoins,
                username: user.user.username,
                walletAddress: user.walletAddress
            }));
        }
        catch (error) {
            logger_1.default.error("Error getting top users by coins:", error);
            throw error;
        }
    }
    /**
     * Initialize user balance if not exists
     */
    static async initializeUserBalance(walletAddress) {
        try {
            const existingBalance = await client_1.default.userCoinBalance.findUnique({
                where: { walletAddress }
            });
            if (!existingBalance) {
                await client_1.default.userCoinBalance.create({
                    data: {
                        achievementCoins: 0,
                        experienceCoins: 0,
                        premiumCoins: 0,
                        socialCoins: 0,
                        totalCoins: 0,
                        walletAddress
                    }
                });
                logger_1.default.info(`Initialized coin balance for user: ${walletAddress}`);
            }
        }
        catch (error) {
            logger_1.default.error("Error initializing user balance:", error);
            throw error;
        }
    }
}
exports.CoinService = CoinService;
