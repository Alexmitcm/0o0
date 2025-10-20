"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = exports.DISCORD_QUEUE_COLLECTS = exports.DISCORD_QUEUE_LIKES = exports.DISCORD_QUEUE_POSTS = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
exports.DISCORD_QUEUE_POSTS = "hey:discord:webhooks:posts";
exports.DISCORD_QUEUE_LIKES = "hey:discord:webhooks:likes";
exports.DISCORD_QUEUE_COLLECTS = "hey:discord:webhooks:collects";
const getRedis = () => {
    if (redisClient)
        return redisClient;
    const url = process.env.REDIS_URL;
    if (!url) {
        throw new Error("Redis not configured. Set REDIS_URL");
    }
    redisClient = new ioredis_1.default(url);
    return redisClient;
};
exports.getRedis = getRedis;
