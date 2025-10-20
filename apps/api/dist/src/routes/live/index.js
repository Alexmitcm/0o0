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
const createLive_1 = __importDefault(require("./createLive"));
const app = new hono_1.Hono();
app.post("/create", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, (0, zod_validator_1.zValidator)("json", zod_1.z.object({ record: zod_1.z.boolean() })), createLive_1.default);
exports.default = app;
