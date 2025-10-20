"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDiscordWebhookWorkerCollects = exports.startDiscordWebhookWorkerLikes = exports.startDiscordWebhookWorkerPosts = void 0;
const logger_1 = require("@hey/helpers/logger");
const redis_1 = require("../utils/redis");
const rateLimit_1 = require("./discord/rateLimit");
const webhook_1 = require("./discord/webhook");
const log = (0, logger_1.withPrefix)("[Worker]");
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const parseItem = (raw) => {
    if (!raw)
        return null;
    try {
        const item = typeof raw === "string"
            ? JSON.parse(raw)
            : raw;
        return item && "kind" in item ? item : null;
    }
    catch (e) {
        log.error("Failed to parse queue item", e);
        return null;
    }
};
const dispatch = async (item) => {
    const { webhookUrl, body } = (0, webhook_1.resolveWebhook)(item);
    if (!webhookUrl) {
        log.warn(`Skipping ${item.kind} webhook: missing webhook URL env`);
        return { status: 0, webhookUrl: undefined };
    }
    const res = await fetch(webhookUrl, {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: "POST"
    });
    return { res, status: res.status, webhookUrl };
};
const startQueueWorker = async (queueKey, label) => {
    let redis;
    try {
        redis = (0, redis_1.getRedis)();
    }
    catch {
        log.warn(`Discord worker (${label}) disabled: Redis not configured`);
        return;
    }
    log.info(`Discord worker started (${label}). Queue: ${queueKey}`);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const delayedKey = `${queueKey}:delayed`;
            await (0, rateLimit_1.promoteDue)(redis, delayedKey, 100);
            const res = (await redis.brpop(queueKey, 1));
            if (!res)
                continue;
            const [, raw] = res;
            const item = parseItem(raw);
            if (!item)
                continue;
            const { webhookUrl } = (0, webhook_1.resolveWebhook)(item);
            if (!webhookUrl) {
                log.warn(`Skipping ${item.kind} webhook: missing webhook URL env`);
                continue;
            }
            // If this webhook has a pending cooldown, re-schedule it individually
            const waitMs = (0, rateLimit_1.getWaitMs)(webhookUrl);
            if (waitMs > 0) {
                await (0, rateLimit_1.schedule)(redis, delayedKey, item, waitMs);
                log.warn(`Cooldown for ${item.kind}. Scheduled after ${Math.ceil(waitMs / 1000)}s`);
                continue;
            }
            // Reserve 1 req/s slot pre-dispatch to avoid concurrent sends for same URL
            (0, rateLimit_1.setNextIn)(webhookUrl, 1000);
            try {
                const result = await dispatch(item);
                const { webhookUrl: url, status, res } = result;
                if (!url)
                    continue;
                if (status === 429) {
                    // Parse retry-after headers/body; fallback to 10s min
                    const resetAfter = Number.parseFloat(res?.headers.get("x-ratelimit-reset-after") ?? "NaN");
                    const retryAfterHeader = Number.parseFloat(res?.headers.get("retry-after") ?? "NaN");
                    let retryAfterSec = Number.isFinite(resetAfter)
                        ? resetAfter
                        : Number.isFinite(retryAfterHeader)
                            ? retryAfterHeader
                            : Number.NaN;
                    if (!Number.isFinite(retryAfterSec)) {
                        const payload = (await res?.json().catch(() => null));
                        const bodyRetry = payload?.retry_after;
                        retryAfterSec =
                            typeof bodyRetry === "number"
                                ? bodyRetry
                                : Number.parseFloat(String(bodyRetry ?? "NaN"));
                    }
                    if (!Number.isFinite(retryAfterSec))
                        retryAfterSec = 10;
                    retryAfterSec = Math.max(10, retryAfterSec);
                    const until = (0, rateLimit_1.setNextIn)(url, retryAfterSec * 1000);
                    const ms = Math.max(0, until - Date.now());
                    await (0, rateLimit_1.schedule)(redis, delayedKey, item, ms);
                    log.warn(`Rate limited for ${item.kind}. Scheduled after ${Math.ceil(ms / 1000)}s`);
                    continue;
                }
                if (!res?.ok) {
                    const text = await res?.text().catch(() => "");
                    throw new Error(`Discord webhook failed (${status}): ${text}`);
                }
                // Success: update from headers if provided
                (0, rateLimit_1.updateFromHeaders)(url, res);
                log.info(`Dispatched Discord webhook: ${item.kind}`);
            }
            catch (_err) {
                const retries = (item.retries ?? 0) + 1;
                if (retries <= 3) {
                    item.retries = retries;
                    await redis.rpush(queueKey, JSON.stringify(item));
                    log.warn(`Requeued ${item.kind} webhook (attempt ${retries})`);
                }
                else {
                    log.error(`Dropped ${item.kind} webhook after ${retries} attempts`);
                }
            }
        }
        catch (e) {
            log.error("Discord worker loop error", e);
            await sleep(1000);
        }
    }
};
const startDiscordWebhookWorkerPosts = async () => startQueueWorker(redis_1.DISCORD_QUEUE_POSTS, "posts");
exports.startDiscordWebhookWorkerPosts = startDiscordWebhookWorkerPosts;
const startDiscordWebhookWorkerLikes = async () => startQueueWorker(redis_1.DISCORD_QUEUE_LIKES, "likes");
exports.startDiscordWebhookWorkerLikes = startDiscordWebhookWorkerLikes;
const startDiscordWebhookWorkerCollects = async () => startQueueWorker(redis_1.DISCORD_QUEUE_COLLECTS, "collects");
exports.startDiscordWebhookWorkerCollects = startDiscordWebhookWorkerCollects;
