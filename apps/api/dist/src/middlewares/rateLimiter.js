"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_rate_limiter_1 = require("hono-rate-limiter");
const sha256_1 = __importDefault(require("../utils/sha256"));
const getIp = (req) => {
    const ips = (req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for") ||
        "unknown").split(",");
    return ips[0].trim();
};
const hashedIp = (req) => (0, sha256_1.default)(getIp(req)).slice(0, 25);
const rateLimiter = ({ requests }) => {
    return (0, hono_rate_limiter_1.rateLimiter)({
        keyGenerator: (c) => {
            const pathHash = (0, sha256_1.default)(c.req.path).slice(0, 25);
            const key = `rate-limit:${pathHash}:${hashedIp(c.req.raw)}`;
            return key;
        }, // 1 minute
        limit: requests,
        standardHeaders: "draft-6",
        windowMs: 1 * 60 * 1000
    });
};
exports.default = rateLimiter;
