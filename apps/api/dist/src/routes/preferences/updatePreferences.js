"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../../prisma/client"));
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const redis_1 = require("../../utils/redis");
const updatePreferences = async (ctx) => {
    try {
        const { appIcon, includeLowScore } = await ctx.req.json();
        const account = ctx.get("account");
        const preference = await client_1.default.preference.upsert({
            create: { accountAddress: account, appIcon, includeLowScore },
            update: { appIcon, includeLowScore },
            where: { accountAddress: account }
        });
        await (0, redis_1.delRedis)(`preferences:${account}`);
        return ctx.json({
            data: {
                appIcon: preference.appIcon ?? 0,
                includeLowScore: preference.includeLowScore ?? false
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = updatePreferences;
