"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../utils/constants");
const lensPg_1 = __importDefault(require("../../../utils/lensPg"));
const redis_1 = require("../../../utils/redis");
const getTotalAccountBatches = async () => {
    const cacheKey = "sitemap:accounts:total";
    const cachedData = await (0, redis_1.getRedis)(cacheKey);
    if (cachedData) {
        return Number(cachedData);
    }
    const usernames = (await lensPg_1.default.query(`
      SELECT CEIL(COUNT(*) / $1) AS count
      FROM account.username_assigned;
    `, { take: constants_1.SITEMAP_BATCH_SIZE }));
    const totalBatches = Number(usernames[0]?.count) || 0;
    await (0, redis_1.setRedis)(cacheKey, totalBatches, (0, redis_1.hoursToSeconds)(constants_1.SITEMAP_CACHE_DAYS * 24));
    return totalBatches;
};
exports.default = getTotalAccountBatches;
