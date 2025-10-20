"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xmlbuilder2_1 = require("xmlbuilder2");
const constants_1 = require("../../../utils/constants");
const common_1 = __importDefault(require("../common"));
const getTotalAccountBatches_1 = __importDefault(require("./getTotalAccountBatches"));
const accountsSitemapIndex = async (ctx) => (0, common_1.default)({
    buildXml: async () => {
        const totalBatches = await (0, getTotalAccountBatches_1.default)();
        const totalGroups = Math.ceil(totalBatches / constants_1.SITEMAP_BATCH_SIZE);
        const sitemapIndex = (0, xmlbuilder2_1.create)({ encoding: "UTF-8", version: "1.0" }).ele("sitemapindex", { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" });
        for (let i = 0; i < totalGroups; i++) {
            sitemapIndex
                .ele("sitemap")
                .ele("loc")
                .txt(`https://hey.xyz/sitemap/accounts/${i + 1}.xml`)
                .up()
                .ele("lastmod")
                .txt(new Date().toISOString())
                .up();
        }
        return sitemapIndex.end({ prettyPrint: true });
    },
    cacheKey: "sitemap:accounts:index",
    ctx
});
exports.default = accountsSitemapIndex;
