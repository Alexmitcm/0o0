"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@hey/data/errors");
const constants_1 = require("../../utils/constants");
const redis_1 = require("../../utils/redis");
const generateSitemap = async ({ ctx, cacheKey, buildXml }) => {
    try {
        const cached = await (0, redis_1.getRedis)(cacheKey);
        if (cached) {
            ctx.header("Content-Type", "application/xml");
            return ctx.body(cached);
        }
        const xml = await buildXml();
        await (0, redis_1.setRedis)(cacheKey, xml, (0, redis_1.hoursToSeconds)(constants_1.SITEMAP_CACHE_DAYS * 24));
        ctx.header("Content-Type", "application/xml");
        return ctx.body(xml);
    }
    catch {
        return ctx.body(errors_1.ERRORS.SomethingWentWrong, 500);
    }
};
exports.default = generateSitemap;
