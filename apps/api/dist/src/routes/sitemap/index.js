"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const accountSitemap_1 = __importDefault(require("./accounts/accountSitemap"));
const accountsGroupSitemap_1 = __importDefault(require("./accounts/accountsGroupSitemap"));
const accountsSitemapIndex_1 = __importDefault(require("./accounts/accountsSitemapIndex"));
const pagesSitemap_1 = __importDefault(require("./pagesSitemap"));
const sitemapIndex_1 = __importDefault(require("./sitemapIndex"));
const app = new hono_1.Hono();
app.get("/all.xml", sitemapIndex_1.default);
app.get("/pages.xml", pagesSitemap_1.default);
app.get("/accounts.xml", accountsSitemapIndex_1.default);
app.get("/accounts/:group.xml", accountsGroupSitemap_1.default);
app.get("/accounts/:group/:batch.xml", accountSitemap_1.default);
exports.default = app;
