"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const LootBoxController_1 = require("../controllers/LootBoxController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const lootBoxSecurity_1 = require("../middlewares/lootBoxSecurity");
const lootBoxRouter = new hono_1.Hono();
// Public routes
lootBoxRouter.get("/", LootBoxController_1.getLootBoxes);
lootBoxRouter.get("/:id", LootBoxController_1.getLootBoxById);
// User routes (require authentication)
lootBoxRouter.use("/check/:id", authMiddleware_1.default);
lootBoxRouter.get("/check/:id", LootBoxController_1.checkLootBoxAvailability);
lootBoxRouter.use("/open/:id", authMiddleware_1.default);
lootBoxRouter.use("/open/:id", lootBoxSecurity_1.lootBoxRateLimit);
lootBoxRouter.use("/open/:id", lootBoxSecurity_1.antiCheatProtection);
lootBoxRouter.use("/open/:id", lootBoxSecurity_1.validateLootBoxOpen);
lootBoxRouter.use("/open/:id", lootBoxSecurity_1.validateAdData);
lootBoxRouter.post("/open/:id", LootBoxController_1.openLootBox);
lootBoxRouter.use("/history", authMiddleware_1.default);
lootBoxRouter.get("/history", LootBoxController_1.getUserLootBoxHistory);
lootBoxRouter.use("/cooldown", authMiddleware_1.default);
lootBoxRouter.get("/cooldown", LootBoxController_1.getUserCooldownStatus);
lootBoxRouter.use("/daily-limits", authMiddleware_1.default);
lootBoxRouter.get("/daily-limits", LootBoxController_1.getUserDailyLimitStatus);
// Admin routes (require admin authentication)
lootBoxRouter.use("/admin", authMiddleware_1.default);
lootBoxRouter.post("/admin", LootBoxController_1.createLootBox);
lootBoxRouter.post("/admin/:id/rewards", LootBoxController_1.addRewardToLootBox);
lootBoxRouter.put("/admin/:id", LootBoxController_1.updateLootBox);
lootBoxRouter.delete("/admin/:id", LootBoxController_1.deleteLootBox);
lootBoxRouter.get("/admin/:id/stats", LootBoxController_1.getLootBoxStats);
exports.default = lootBoxRouter;
