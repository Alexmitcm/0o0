import { Hono } from "hono";
import {
  addRewardToLootBox,
  checkLootBoxAvailability,
  createLootBox,
  deleteLootBox,
  getLootBoxById,
  getLootBoxes,
  getLootBoxStats,
  getUserCooldownStatus,
  getUserDailyLimitStatus,
  getUserLootBoxHistory,
  openLootBox,
  updateLootBox
} from "../controllers/LootBoxController";
import authMiddleware from "../middlewares/authMiddleware";
import {
  antiCheatProtection,
  lootBoxRateLimit,
  validateAdData,
  validateLootBoxOpen
} from "../middlewares/lootBoxSecurity";

const lootBoxRouter = new Hono();

// Public routes
lootBoxRouter.get("/", getLootBoxes);
lootBoxRouter.get("/:id", getLootBoxById);

// User routes (require authentication)
lootBoxRouter.use("/check/:id", authMiddleware);
lootBoxRouter.get("/check/:id", checkLootBoxAvailability);

lootBoxRouter.use("/open/:id", authMiddleware);
lootBoxRouter.use("/open/:id", lootBoxRateLimit);
lootBoxRouter.use("/open/:id", antiCheatProtection);
lootBoxRouter.use("/open/:id", validateLootBoxOpen);
lootBoxRouter.use("/open/:id", validateAdData);
lootBoxRouter.post("/open/:id", openLootBox);

lootBoxRouter.use("/history", authMiddleware);
lootBoxRouter.get("/history", getUserLootBoxHistory);

lootBoxRouter.use("/cooldown", authMiddleware);
lootBoxRouter.get("/cooldown", getUserCooldownStatus);

lootBoxRouter.use("/daily-limits", authMiddleware);
lootBoxRouter.get("/daily-limits", getUserDailyLimitStatus);

// Admin routes (require admin authentication)
lootBoxRouter.use("/admin", authMiddleware);
lootBoxRouter.post("/admin", createLootBox);
lootBoxRouter.post("/admin/:id/rewards", addRewardToLootBox);
lootBoxRouter.put("/admin/:id", updateLootBox);
lootBoxRouter.delete("/admin/:id", deleteLootBox);
lootBoxRouter.get("/admin/:id/stats", getLootBoxStats);

export default lootBoxRouter;
