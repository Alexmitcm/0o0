"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../utils/constants");
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const redis_1 = require("../../utils/redis");
const sha256_1 = __importDefault(require("../../utils/sha256"));
const getMetadata_1 = __importDefault(require("./helpers/getMetadata"));
const getOembed = async (ctx) => {
    try {
        const { url } = ctx.req.query();
        const cacheKey = `oembed:${(0, sha256_1.default)(url)}`;
        const cachedValue = await (0, redis_1.getRedis)(cacheKey);
        ctx.header("Cache-Control", constants_1.CACHE_AGE_1_DAY);
        if (cachedValue) {
            return ctx.json({ data: JSON.parse(cachedValue), success: true });
        }
        const oembed = await (0, getMetadata_1.default)(url);
        await (0, redis_1.setRedis)(cacheKey, oembed, (0, redis_1.generateExtraLongExpiry)());
        return ctx.json({ data: oembed, success: true });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = getOembed;
