"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@hey/data/enums");
const logger_1 = require("@hey/helpers/logger");
const discordQueue_1 = __importDefault(require("./utils/discordQueue"));
const log = (0, logger_1.withPrefix)("[API]");
const likes = async (ctx) => {
    let body = {};
    try {
        body = (await ctx.req.json());
    }
    catch {
        body = {};
    }
    const host = ctx.req.header("host") ?? "";
    if (host.includes("localhost")) {
        return ctx.json({
            data: { ok: true, skipped: true },
            status: enums_1.Status.Success
        });
    }
    try {
        const item = {
            createdAt: Date.now(),
            kind: "like",
            payload: { slug: body.slug },
            retries: 0
        };
        void (0, discordQueue_1.default)(item);
    }
    catch (err) {
        log.error("Failed to enqueue like webhook", err);
    }
    return ctx.json({ data: { ok: true }, status: enums_1.Status.Success });
};
exports.default = likes;
