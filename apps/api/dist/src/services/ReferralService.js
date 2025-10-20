"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const logger_1 = __importDefault(require("../utils/logger"));
// Referral contract ABI - only the functions we need
const REFERRAL_ABI = [
    {
        inputs: [{ name: "player", type: "address" }],
        name: "getPlayerNode",
        outputs: [
            { name: "startTime", type: "uint256" },
            { name: "balance", type: "uint256" },
            { name: "point", type: "uint24" },
            { name: "depth", type: "uint24" },
            { name: "parent", type: "address" },
            { name: "leftChild", type: "address" },
            { name: "rightChild", type: "address" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ name: "player", type: "address" }],
        name: "getUnbalancedPlayerNode",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getBalanceOfPlayer",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
];
class ReferralService {
    publicClient;
    referralContractAddress;
    infuraUrl;
    constructor() {
        // Use default values for development/testing
        this.infuraUrl =
            process.env.INFURA_URL || "https://arbitrum-mainnet.infura.io/v3/test";
        this.referralContractAddress =
            process.env.REFERRAL_CONTRACT_ADDRESS ||
                "0x1234567890123456789012345678901234567890";
        this.publicClient = (0, viem_1.createPublicClient)({
            chain: chains_1.arbitrum,
            transport: (0, viem_1.http)(this.infuraUrl)
        });
    }
    normalizeWalletAddress(address) {
        return address.toLowerCase();
    }
    /**
     * Build the user's own referral tree (downline only)
     * This is secure because it only fetches the user's own structure
     */
    async buildUserReferralTree(userWallet, maxDepth = 3) {
        if (!userWallet || maxDepth < 0)
            return [];
        try {
            // For testing, return mock data
            if (!process.env.INFURA_URL || process.env.INFURA_URL.includes("test")) {
                return this.getMockReferralTree(userWallet, maxDepth);
            }
            const normalizedAddress = this.normalizeWalletAddress(userWallet);
            // Start building the tree from the user's wallet
            return await this.buildTreeRecursively(normalizedAddress, 0, maxDepth);
        }
        catch (error) {
            logger_1.default.error(`Error building user referral tree for ${userWallet}:`, error);
            return [];
        }
    }
    getMockReferralTree(userWallet, maxDepth) {
        const mockNodes = [
            {
                balance: "1000000", // 1 USDT in wei
                depth: 0,
                isUnbalanced: false,
                leftChild: "0x1111111111111111111111111111111111111111",
                parent: null,
                rightChild: "0x2222222222222222222222222222222222222222",
                startTime: Date.now(),
                wallet: userWallet
            }
        ];
        if (maxDepth > 0) {
            mockNodes.push({
                balance: "500000", // 0.5 USDT
                depth: 1,
                isUnbalanced: true,
                leftChild: null,
                parent: userWallet,
                rightChild: null,
                startTime: Date.now() - 86400000, // 1 day ago
                wallet: "0x1111111111111111111111111111111111111111"
            }, {
                balance: "750000", // 0.75 USDT
                depth: 1,
                isUnbalanced: false,
                leftChild: null,
                parent: userWallet,
                rightChild: null,
                startTime: Date.now() - 172800000, // 2 days ago
                wallet: "0x2222222222222222222222222222222222222222"
            });
        }
        return mockNodes;
    }
    /**
     * Recursively build the tree structure
     */
    async buildTreeRecursively(walletAddress, currentDepth, maxDepth) {
        if (currentDepth > maxDepth)
            return [];
        try {
            // Get node data using getPlayerNode
            const nodeData = await this.publicClient.readContract({
                abi: REFERRAL_ABI,
                address: this.referralContractAddress,
                args: [walletAddress],
                functionName: "getPlayerNode"
            });
            // Check if node exists (startTime > 0)
            if (nodeData[0] === 0n) {
                return [];
            }
            // Check if node is unbalanced
            const isUnbalanced = await this.publicClient.readContract({
                abi: REFERRAL_ABI,
                address: this.referralContractAddress,
                args: [walletAddress],
                functionName: "getUnbalancedPlayerNode"
            });
            const leftChild = nodeData[5];
            const rightChild = nodeData[6];
            const parent = nodeData[4];
            const currentNode = {
                balance: nodeData[1].toString(),
                depth: currentDepth,
                isUnbalanced: isUnbalanced,
                leftChild: leftChild === "0x0000000000000000000000000000000000000000"
                    ? null
                    : leftChild,
                parent: parent === "0x0000000000000000000000000000000000000000"
                    ? null
                    : parent,
                rightChild: rightChild === "0x0000000000000000000000000000000000000000"
                    ? null
                    : rightChild,
                startTime: Number(nodeData[0]),
                wallet: walletAddress
            };
            // Recursively fetch children (downline only)
            const leftBranch = leftChild && leftChild !== "0x0000000000000000000000000000000000000000"
                ? await this.buildTreeRecursively(leftChild, currentDepth + 1, maxDepth)
                : [];
            const rightBranch = rightChild &&
                rightChild !== "0x0000000000000000000000000000000000000000"
                ? await this.buildTreeRecursively(rightChild, currentDepth + 1, maxDepth)
                : [];
            return [currentNode, ...leftBranch, ...rightBranch];
        }
        catch (error) {
            logger_1.default.error(`Error fetching node data for ${walletAddress} at depth ${currentDepth}:`, error);
            return [];
        }
    }
    /**
     * Get the total balance for a specific player
     */
    async getPlayerBalance(walletAddress) {
        try {
            const balance = await this.publicClient.readContract({
                abi: REFERRAL_ABI,
                address: this.referralContractAddress,
                args: [],
                functionName: "getBalanceOfPlayer"
            });
            return balance.toString();
        }
        catch (error) {
            logger_1.default.error(`Error fetching balance for ${walletAddress}:`, error);
            return "0";
        }
    }
}
exports.ReferralService = ReferralService;
exports.default = new ReferralService();
