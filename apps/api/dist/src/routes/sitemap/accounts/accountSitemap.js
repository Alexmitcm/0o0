"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@hey/data/errors");
const xmlbuilder2_1 = require("xmlbuilder2");
const constants_1 = require("../../../utils/constants");
const lensPg_1 = __importDefault(require("../../../utils/lensPg"));
const common_1 = __importDefault(require("../common"));
const accountSitemap = async (ctx) => {
    const params = ctx.req.param();
    const group = params["group"];
    const batch = params["batch.xml"].replace(".xml", "");
    if (Number.isNaN(Number(group)) || Number.isNaN(Number(batch))) {
        return ctx.body(errors_1.ERRORS.SomethingWentWrong, 400);
    }
    if (Number(group) === 0 || Number(batch) === 0) {
        return ctx.body(errors_1.ERRORS.SomethingWentWrong, 400);
    }
    return (0, common_1.default)({
        buildXml: async () => {
            const sitemap = (0, xmlbuilder2_1.create)({ encoding: "UTF-8", version: "1.0" }).ele("urlset", { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" });
            const globalBatch = (Number(group) - 1) * constants_1.SITEMAP_BATCH_SIZE + (Number(batch) - 1);
            const dbUsernames = (await lensPg_1.default.query(`
          SELECT local_name
          FROM account.username_assigned
          WHERE id > $1
          ORDER BY id
          LIMIT $2;
        `, { skip: globalBatch * constants_1.SITEMAP_BATCH_SIZE, take: constants_1.SITEMAP_BATCH_SIZE }));
            for (const { local_name } of dbUsernames) {
                sitemap
                    .ele("url")
                    .ele("loc")
                    .txt(`https://hey.xyz/u/${local_name}`)
                    .up()
                    .ele("lastmod")
                    .txt(new Date().toISOString())
                    .up();
            }
            return sitemap.end({ prettyPrint: true });
        },
        cacheKey: `sitemap:accounts:${group}-${batch}`,
        ctx
    });
};
exports.default = accountSitemap;
