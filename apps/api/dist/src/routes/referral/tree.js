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
const hono_1 = require("hono");
const authContext_1 = require("../../context/authContext");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const app = new hono_1.Hono();
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
app.use("*", authMiddleware_1.default);
app.get("/", async (c) => {
    try {
        // Get the authenticated user's wallet address from JWT
        const authContext = (0, authContext_1.getAuthContext)(c);
        if (!authContext?.walletAddress) {
            return c.json({ error: "Unauthorized - No wallet address found" }, 401);
        }
        const userWallet = authContext.walletAddress;
        const maxDepth = 3; // Fixed max depth for security
        // Import the service dynamically to avoid circular dependencies
        const { default: ReferralService } = await Promise.resolve().then(() => __importStar(require("../../services/ReferralService")));
        // Build the user's own referral tree (downline only)
        const nodes = await ReferralService.buildUserReferralTree(userWallet, maxDepth);
        return c.json({
            data: nodes,
            meta: {
                maxDepth,
                rootWallet: userWallet,
                totalNodes: nodes.length
            }
        });
    }
    catch (error) {
        console.error("Error fetching user referral tree:", error);
        return c.json({ error: "Failed to fetch referral tree" }, 500);
    }
});
exports.default = app;
