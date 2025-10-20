"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAuthService = void 0;
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const client_1 = __importDefault(require("../prisma/client"));
const address_1 = require("../utils/address");
const BlockchainService_1 = __importDefault(require("./BlockchainService"));
const JwtService_1 = __importDefault(require("./JwtService"));
class SimpleAuthService {
    blockchainService;
    jwtService;
    constructor() {
        this.blockchainService = BlockchainService_1.default;
        this.jwtService = JwtService_1.default;
    }
    normalizeWalletAddress(address) {
        return (0, address_1.normalizeAddress)(address);
    }
    /**
     * Ultra-simple login/registration
     * Only 2 states: Standard or Premium
     */
    async login(request) {
        try {
            const { walletAddress, profileId } = request;
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            logger_1.default.info(`Simple login for wallet: ${normalizedAddress}, profile: ${profileId}`);
            // Check if user exists
            const existingUser = await client_1.default.user.findUnique({
                where: { walletAddress: normalizedAddress }
            });
            // Check premium status on-chain
            const isPremiumOnChain = await this.blockchainService.isWalletPremium(normalizedAddress);
            if (existingUser) {
                // Existing user login
                return await this.handleExistingUser(existingUser, profileId, isPremiumOnChain);
            }
            // New user registration
            return await this.handleNewUser(normalizedAddress, profileId, isPremiumOnChain);
        }
        catch (error) {
            logger_1.default.error("Error in simple login:", error);
            throw new Error("Login failed");
        }
    }
    async handleNewUser(walletAddress, profileId, isPremiumOnChain) {
        // Create user with premium status if on-chain
        const newUser = await client_1.default.user.create({
            data: {
                lastActiveAt: new Date(),
                linkedProfileId: isPremiumOnChain ? profileId : null,
                status: isPremiumOnChain ? "Premium" : "Standard",
                totalLogins: 1,
                walletAddress
            }
        });
        // Create premium profile link if premium
        if (isPremiumOnChain) {
            await client_1.default.premiumProfile.create({
                data: {
                    isActive: true,
                    linkedAt: new Date(),
                    profileId,
                    walletAddress
                }
            });
        }
        const token = this.jwtService.generateToken({
            linkedProfileId: newUser.linkedProfileId || undefined,
            status: newUser.status,
            walletAddress
        });
        return {
            isNewUser: true,
            success: true,
            token,
            user: {
                avatarUrl: newUser.avatarUrl || undefined,
                displayName: newUser.displayName || undefined,
                email: newUser.email || undefined,
                isPremium: newUser.status === "Premium",
                profileId: newUser.linkedProfileId || undefined,
                username: newUser.username || undefined,
                walletAddress: newUser.walletAddress
            }
        };
    }
    async handleExistingUser(user, profileId, isPremiumOnChain) {
        // Update activity
        await client_1.default.user.update({
            data: {
                lastActiveAt: new Date(),
                totalLogins: user.totalLogins + 1
            },
            where: { walletAddress: user.walletAddress }
        });
        // Handle premium upgrade
        if (!user.linkedProfileId && isPremiumOnChain) {
            await client_1.default.user.update({
                data: {
                    linkedProfileId: profileId,
                    status: "Premium"
                },
                where: { walletAddress: user.walletAddress }
            });
            await client_1.default.premiumProfile.create({
                data: {
                    isActive: true,
                    linkedAt: new Date(),
                    profileId,
                    walletAddress: user.walletAddress
                }
            });
        }
        const token = this.jwtService.generateToken({
            linkedProfileId: user.linkedProfileId || (isPremiumOnChain ? profileId : undefined),
            status: isPremiumOnChain ? "Premium" : user.status,
            walletAddress: user.walletAddress
        });
        return {
            isNewUser: false,
            success: true,
            token,
            user: {
                avatarUrl: user.avatarUrl || undefined,
                displayName: user.displayName || undefined,
                email: user.email || undefined,
                isPremium: isPremiumOnChain || user.status === "Premium",
                profileId: user.linkedProfileId || (isPremiumOnChain ? profileId : undefined),
                username: user.username || undefined,
                walletAddress: user.walletAddress
            }
        };
    }
    /**
     * Get user status - ultra simple
     */
    async getUserStatus(walletAddress) {
        const user = await client_1.default.user.findUnique({
            where: { walletAddress: this.normalizeWalletAddress(walletAddress) }
        });
        if (!user) {
            return { isPremium: false };
        }
        return {
            isPremium: user.status === "Premium",
            profileId: user.linkedProfileId || undefined
        };
    }
    /**
     * Validate JWT token
     */
    async validateToken(token) {
        return this.jwtService.verifyToken(token);
    }
}
exports.SimpleAuthService = SimpleAuthService;
exports.default = new SimpleAuthService();
