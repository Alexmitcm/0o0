"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@hey/data/errors");
const xmlbuilder2_1 = require("xmlbuilder2");
const constants_1 = require("../../../utils/constants");
const common_1 = __importDefault(require("../common"));
const getTotalAccountBatches_1 = __importDefault(require("./getTotalAccountBatches"));
const accountsGroupSitemap = async (ctx) => {
    const params = ctx.req.param();
    const groupParam = params["group.xml"].replace(".xml", "");
    if (Number.isNaN(Number(groupParam)) || Number(groupParam) === 0) {
        return ctx.body(errors_1.ERRORS.SomethingWentWrong, 400);
    }
    const group = Number(groupParam);
    return (0, common_1.default)({
        buildXml: async () => {
            const totalBatches = await (0, getTotalAccountBatches_1.default)();
            const startBatch = (group - 1) * constants_1.SITEMAP_BATCH_SIZE;
            const endBatch = Math.min(startBatch + constants_1.SITEMAP_BATCH_SIZE, totalBatches);
            const sitemapIndex = (0, xmlbuilder2_1.create)({ encoding: "UTF-8", version: "1.0" }).ele("sitemapindex", { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" });
            for (let i = startBatch; i < endBatch; i++) {
                sitemapIndex
                    .ele("sitemap")
                    .ele("loc")
                    .txt(`https://hey.xyz/sitemap/accounts/${group}/${i - startBatch + 1}.xml`)
                    .up()
                    .ele("lastmod")
                    .txt(new Date().toISOString())
                    .up();
            }
            return sitemapIndex.end({ prettyPrint: true });
        },
        cacheKey: `sitemap:accounts:group:${group}`,
        ctx
    });
};
exports.default = accountsGroupSitemap;
