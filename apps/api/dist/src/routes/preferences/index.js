"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const getPreferences_1 = __importDefault(require("./getPreferences"));
const updatePreferences_1 = __importDefault(require("./updatePreferences"));
const app = new hono_1.Hono();
app.get("/get", rateLimiter_1.moderateRateLimit, getPreferences_1.default);
app.post("/update", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, (0, zod_validator_1.zValidator)("json", zod_1.z.object({
    appIcon: zod_1.z.number().optional(),
    includeLowScore: zod_1.z.boolean().optional()
})), updatePreferences_1.default);
exports.default = app;
