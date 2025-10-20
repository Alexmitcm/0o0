"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedule = exports.promoteDue = exports.updateFromHeaders = exports.setNextIn = exports.getWaitMs = exports.DELAYED_QUEUE_KEY = void 0;
exports.DELAYED_QUEUE_KEY = "hey:discord:webhooks:delayed";
const nextAtMap = () => (globalThis.__heyWebhookNextAt ??= new Map());
const getWaitMs = (webhookUrl, now = Date.now()) => {
    const until = nextAtMap().get(webhookUrl) ?? 0;
    return until > now ? until - now : 0;
};
exports.getWaitMs = getWaitMs;
const setNextIn = (webhookUrl, delayMs) => {
    const until = Date.now() + Math.max(0, Math.ceil(delayMs));
    const map = nextAtMap();
    const prev = map.get(webhookUrl) ?? 0;
    const value = Math.max(prev, until);
    map.set(webhookUrl, value);
    return value;
};
exports.setNextIn = setNextIn;
const updateFromHeaders = (webhookUrl, res) => {
    const remaining = Number.parseInt(res.headers.get("x-ratelimit-remaining") ?? "NaN", 10);
    const resetAfterSec = Number.parseFloat(res.headers.get("x-ratelimit-reset-after") ?? "NaN");
    if (Number.isFinite(remaining) &&
        remaining <= 0 &&
        Number.isFinite(resetAfterSec)) {
        (0, exports.setNextIn)(webhookUrl, resetAfterSec * 1000);
    }
};
exports.updateFromHeaders = updateFromHeaders;
const promoteDue = async (r, key, limit = 100) => {
    const now = Date.now();
    const due = await r.zrangebyscore(key, 0, now, "LIMIT", 0, limit);
    if (due.length === 0)
        return 0;
    const multi = r.multi();
    for (const value of due) {
        multi.zrem(key, value);
        multi.rpush(key.replace(":delayed", ""), value);
    }
    await multi.exec();
    return due.length;
};
exports.promoteDue = promoteDue;
const schedule = async (r, key, item, delayMs) => {
    const ts = Date.now() + Math.max(0, Math.ceil(delayMs));
    await r.zadd(key, String(ts), JSON.stringify(item));
};
exports.schedule = schedule;
