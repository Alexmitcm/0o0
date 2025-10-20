"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const indexer_1 = __importDefault(require("@hey/indexer"));
const defaultMetadata_1 = __importDefault(require("../../utils/defaultMetadata"));
const redis_1 = require("../../utils/redis");
const generateOg = async ({ ctx, cacheKey, query, variables, extractData, buildJsonLd, buildHtml }) => {
    try {
        const cached = await (0, redis_1.getRedis)(cacheKey);
        if (cached) {
            return ctx.html(cached, 200);
        }
        const { data } = await indexer_1.default.query({
            fetchPolicy: "no-cache",
            query,
            variables
        });
        const parsed = extractData(data);
        if (!parsed) {
            return ctx.html(defaultMetadata_1.default, 404);
        }
        const jsonLd = buildJsonLd(parsed);
        const escapedJsonLd = JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026");
        const ogHtml = await buildHtml(parsed, escapedJsonLd);
        const cleanHtml = ogHtml.toString().replace(/\n\s+/g, "").trim();
        await (0, redis_1.setRedis)(cacheKey, cleanHtml);
        return ctx.html(cleanHtml, 200);
    }
    catch {
        return ctx.html(defaultMetadata_1.default, 500);
    }
};
exports.default = generateOg;
