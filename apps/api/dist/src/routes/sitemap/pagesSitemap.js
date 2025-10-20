"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@hey/data/errors");
const xmlbuilder2_1 = require("xmlbuilder2");
const urls = [
    { path: "/", priority: "1" },
    { path: "/terms", priority: "1" },
    { path: "/privacy", priority: "1" },
    { path: "/guidelines", priority: "1" },
    { path: "/support", priority: "1" }
];
const pagesSitemap = async (ctx) => {
    try {
        const sitemap = (0, xmlbuilder2_1.create)({ encoding: "UTF-8", version: "1.0" }).ele("urlset", { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" });
        for (const page of urls) {
            sitemap
                .ele("url")
                .ele("loc")
                .txt(`https://hey.xyz${page.path}`)
                .up()
                .ele("lastmod")
                .txt(new Date().toISOString())
                .up();
        }
        ctx.header("Content-Type", "application/xml");
        return ctx.body(sitemap.end({ prettyPrint: true }));
    }
    catch {
        return ctx.body(errors_1.ERRORS.SomethingWentWrong, 500);
    }
};
exports.default = pagesSitemap;
