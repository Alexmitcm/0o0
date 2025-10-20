"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueDiscordWebhook = void 0;
const logger_1 = require("@hey/helpers/logger");
const redis_1 = require("./redis");
const enqueueDiscordWebhook = async (item) => {
    const log = (0, logger_1.withPrefix)("[API]");
    try {
        const redis = (0, redis_1.getRedis)();
        const key = item.kind === "post"
            ? redis_1.DISCORD_QUEUE_POSTS
            : item.kind === "like"
                ? redis_1.DISCORD_QUEUE_LIKES
                : redis_1.DISCORD_QUEUE_COLLECTS;
        await redis.rpush(key, JSON.stringify(item));
        log.info(`Enqueued discord webhook: ${item.kind}`);
    }
    catch (err) {
        log.error("Failed to enqueue discord webhook", err);
    }
};
exports.enqueueDiscordWebhook = enqueueDiscordWebhook;
exports.default = exports.enqueueDiscordWebhook;
