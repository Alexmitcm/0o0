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
exports.getLootBoxStats = exports.deleteLootBox = exports.updateLootBox = exports.addRewardToLootBox = exports.createLootBox = exports.getUserDailyLimitStatus = exports.getUserCooldownStatus = exports.getUserLootBoxHistory = exports.openLootBox = exports.checkLootBoxAvailability = exports.getLootBoxById = exports.getLootBoxes = void 0;
const LootBoxService = __importStar(require("../services/LootBoxService"));
const logger_1 = __importDefault(require("../utils/logger"));
const getLootBoxes = async (c) => {
    try {
        const lootBoxes = await LootBoxService.getActiveLootBoxes();
        return c.json({
            data: lootBoxes,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting loot boxes:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get loot boxes",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getLootBoxes = getLootBoxes;
const getLootBoxById = async (c) => {
    try {
        const id = c.req.param("id");
        if (!id) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "Loot box ID is required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const lootBox = await LootBoxService.getLootBoxById(id);
        if (!lootBox) {
            return c.json({
                error: {
                    code: "NOT_FOUND",
                    message: "Loot box not found",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 404);
        }
        return c.json({
            data: lootBox,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting loot box by ID:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getLootBoxById = getLootBoxById;
const checkLootBoxAvailability = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        const lootBoxId = c.req.param("id");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        if (!lootBoxId) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "Loot box ID is required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const availability = await LootBoxService.canUserOpenLootBox(walletAddress, lootBoxId);
        return c.json({
            data: availability,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error checking loot box availability:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to check loot box availability",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.checkLootBoxAvailability = checkLootBoxAvailability;
const openLootBox = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        const lootBoxId = c.req.param("id");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        if (!lootBoxId) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "Loot box ID is required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const body = await c.req.json();
        const { adData, requestInfo } = body;
        // Get request information for security
        const requestInfoData = {
            ipAddress: c.req.header("x-forwarded-for") ||
                c.req.header("x-real-ip") ||
                "unknown",
            sessionId: requestInfo?.sessionId || "unknown",
            userAgent: c.req.header("user-agent") || "unknown"
        };
        const result = await LootBoxService.openLootBox(walletAddress, lootBoxId, adData, requestInfoData);
        if (!result.success) {
            return c.json({
                data: {
                    nextAvailableAt: result.nextAvailableAt
                },
                error: {
                    code: "LOOT_BOX_UNAVAILABLE",
                    message: result.error || "Cannot open loot box",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        return c.json({
            data: result,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error opening loot box:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to open loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.openLootBox = openLootBox;
const getUserLootBoxHistory = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const offset = Number.parseInt(c.req.query("offset") || "0");
        const history = await LootBoxService.getUserLootBoxHistory(walletAddress, limit, offset);
        return c.json({
            data: history,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user loot box history:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get loot box history",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserLootBoxHistory = getUserLootBoxHistory;
const getUserCooldownStatus = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        const cooldowns = await LootBoxService.getUserCooldownStatus(walletAddress);
        return c.json({
            data: cooldowns,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user cooldown status:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get cooldown status",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserCooldownStatus = getUserCooldownStatus;
const getUserDailyLimitStatus = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        const dailyLimits = await LootBoxService.getUserDailyLimitStatus(walletAddress);
        return c.json({
            data: dailyLimits,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user daily limit status:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get daily limit status",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserDailyLimitStatus = getUserDailyLimitStatus;
// Admin endpoints
const createLootBox = async (c) => {
    try {
        const adminWalletAddress = c.get("walletAddress");
        if (!adminWalletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        // TODO: Add admin role check
        // const isAdmin = await checkAdminRole(adminWalletAddress);
        // if (!isAdmin) {
        //   return c.json({ error: "Unauthorized" }, 403);
        // }
        const body = await c.req.json();
        const lootBox = await LootBoxService.createLootBox(body);
        return c.json({
            data: lootBox,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error creating loot box:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.createLootBox = createLootBox;
const addRewardToLootBox = async (c) => {
    try {
        const adminWalletAddress = c.get("walletAddress");
        if (!adminWalletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        // TODO: Add admin role check
        const lootBoxId = c.req.param("id");
        const body = await c.req.json();
        const { rewardType, rewardValue, probability } = body;
        if (!rewardType || !rewardValue || probability === undefined) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "rewardType, rewardValue, and probability are required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const reward = await LootBoxService.addRewardToLootBox(lootBoxId, rewardType, rewardValue, probability);
        return c.json({
            data: reward,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error adding reward to loot box:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to add reward to loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.addRewardToLootBox = addRewardToLootBox;
const updateLootBox = async (c) => {
    try {
        const adminWalletAddress = c.get("walletAddress");
        if (!adminWalletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        // TODO: Add admin role check
        const id = c.req.param("id");
        const body = await c.req.json();
        const lootBox = await LootBoxService.updateLootBox(id, body);
        return c.json({
            data: lootBox,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error updating loot box:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to update loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.updateLootBox = updateLootBox;
const deleteLootBox = async (c) => {
    try {
        const adminWalletAddress = c.get("walletAddress");
        if (!adminWalletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        // TODO: Add admin role check
        const id = c.req.param("id");
        const result = await LootBoxService.deleteLootBox(id);
        return c.json({
            data: result,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error deleting loot box:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to delete loot box",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.deleteLootBox = deleteLootBox;
const getLootBoxStats = async (c) => {
    try {
        const adminWalletAddress = c.get("walletAddress");
        if (!adminWalletAddress) {
            return c.json({
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 401);
        }
        // TODO: Add admin role check
        const id = c.req.param("id");
        const stats = await LootBoxService.getLootBoxStats(id);
        return c.json({
            data: stats,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting loot box stats:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get loot box stats",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getLootBoxStats = getLootBoxStats;
