"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
const BlockchainService_1 = __importDefault(require("../services/BlockchainService"));
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const SegmentationService = {
    getForWallet: async (walletAddress) => {
        const normalized = walletAddress.toLowerCase();
        const cached = await client_1.default.referralBalanceCache
            .findUnique({
            where: { walletAddress: normalized }
        })
            .catch(() => null);
        if (cached) {
            return {
                equilibriumPoint: cached.equilibriumPoint ?? null,
                isBalanced: cached.isBalanced,
                leftCount: cached.leftCount,
                rightCount: cached.rightCount
            };
        }
        const node = await BlockchainService_1.default.getNodeData(normalized);
        if (!node) {
            // No node yet -> consider unbalanced with zero branches
            const result = {
                isBalanced: false,
                leftCount: 0,
                rightCount: 0
            };
            await client_1.default.referralBalanceCache
                .upsert({
                create: {
                    isBalanced: false,
                    leftCount: 0,
                    rightCount: 0,
                    walletAddress: normalized
                },
                update: { isBalanced: false, leftCount: 0, rightCount: 0 },
                where: { walletAddress: normalized }
            })
                .catch(() => null);
            return result;
        }
        const hasLeft = !!node.leftChild && node.leftChild !== ZERO_ADDRESS;
        const hasRight = !!node.rightChild && node.rightChild !== ZERO_ADDRESS;
        const leftCount = node.depthLeftBranch > 0 ? node.depthLeftBranch : hasLeft ? 1 : 0;
        const rightCount = node.depthRightBranch > 0 ? node.depthRightBranch : hasRight ? 1 : 0;
        const isBalanced = hasLeft && hasRight;
        await client_1.default.referralBalanceCache
            .upsert({
            create: {
                equilibriumPoint: node.point,
                isBalanced,
                leftCount,
                rightCount,
                walletAddress: normalized
            },
            update: {
                equilibriumPoint: node.point,
                isBalanced,
                leftCount,
                rightCount
            },
            where: { walletAddress: normalized }
        })
            .catch(() => null);
        return { equilibriumPoint: node.point, isBalanced, leftCount, rightCount };
    }
};
exports.default = SegmentationService;
