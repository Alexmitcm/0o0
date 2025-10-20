"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const getOembed_1 = __importDefault(require("./getOembed"));
const app = new hono_1.Hono();
app.get("/get", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("query", zod_1.z.object({ url: zod_1.z.string().url() })), getOembed_1.default);
exports.default = app;
