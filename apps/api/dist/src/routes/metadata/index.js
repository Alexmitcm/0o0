"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const getSTS_1 = __importDefault(require("./getSTS"));
const app = new hono_1.Hono();
app.get("/sts", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, getSTS_1.default);
exports.default = app;
