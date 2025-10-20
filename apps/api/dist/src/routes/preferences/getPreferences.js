"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../../prisma/client"));
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const redis_1 = require("../../utils/redis");
const getPreferences = async (ctx) => {
    try {
        const account = ctx.get("account");
        // If user is not authenticated, return default preferences
        if (!account) {
            const data = {
                appIcon: 0,
                includeLowScore: false
            };
            return ctx.json({ data, success: true });
        }
        const cacheKey = `preferences:${account}`;
        const cachedValue = await (0, redis_1.getRedis)(cacheKey);
        if (cachedValue) {
            return ctx.json({ data: JSON.parse(cachedValue), success: true });
        }
        const preference = await client_1.default.preference.findUnique({
            where: { accountAddress: account }
        });
        const data = {
            appIcon: preference?.appIcon || 0,
            includeLowScore: Boolean(preference?.includeLowScore)
        };
        await (0, redis_1.setRedis)(cacheKey, data);
        return ctx.json({ data, success: true });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = getPreferences;
