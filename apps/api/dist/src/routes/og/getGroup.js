"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const escapeHtml_1 = __importDefault(require("@hey/helpers/escapeHtml"));
const getAvatar_1 = __importDefault(require("@hey/helpers/getAvatar"));
const normalizeDescription_1 = __importDefault(require("@hey/helpers/normalizeDescription"));
const generated_1 = require("@hey/indexer/generated");
const html_1 = require("hono/html");
const ogUtils_1 = __importDefault(require("./ogUtils"));
const getGroup = async (ctx) => {
    const { address } = ctx.req.param();
    const cacheKey = `og:group:${address}`;
    return (0, ogUtils_1.default)({
        buildHtml: (group, escapedJsonLd) => {
            const name = group.metadata?.name || "Group";
            const title = `${name} on Hey`;
            const description = (0, normalizeDescription_1.default)(group?.metadata?.description, title);
            const avatar = (0, getAvatar_1.default)(group, constants_1.TRANSFORMS.AVATAR_BIG);
            const escTitle = (0, escapeHtml_1.default)(title);
            const escDescription = (0, escapeHtml_1.default)(description);
            const escName = (0, escapeHtml_1.default)(name);
            return (0, html_1.html) `
        <html>
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <meta http-equiv="content-language" content="en-US" />
            <title>${escTitle}</title>
            <meta name="description" content="${escDescription}" />
            <meta property="og:title" content="${escTitle}" />
            <meta property="og:description" content="${escDescription}" />
            <meta property="og:type" content="profile" />
            <meta property="og:site_name" content="Hey" />
            <meta property="og:url" content="https://hey.xyz/g/${group.address}" />
            <meta property="og:image" content="${avatar}" />
            <meta property="og:logo" content="${constants_1.STATIC_IMAGES_URL}/app-icon/0.png" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="${escTitle}" />
            <meta name="twitter:description" content="${escDescription}" />
            <meta property="twitter:image" content="${avatar}" />
            <meta name="twitter:site" content="@heydotxyz" />
            <link rel="canonical" href="https://hey.xyz/g/${group.address}" />
          </head>
          <body>
            <script type="application/ld+json">${(0, html_1.raw)(escapedJsonLd)}</script>
            <img src="${avatar}" alt="${escTitle}" height="100" width="100" />
            <h1>${escName}</h1>
            <h2>${escDescription}</h2>
          </body>
        </html>
      `;
        },
        buildJsonLd: (group) => {
            const name = group.metadata?.name || "Group";
            const title = `${name} on Hey`;
            const description = (0, normalizeDescription_1.default)(group?.metadata?.description, title);
            return {
                "@context": "https://schema.org",
                "@id": `https://hey.xyz/g/${address}`,
                "@type": "Organization",
                alternateName: address,
                description,
                image: (0, getAvatar_1.default)(group, constants_1.TRANSFORMS.AVATAR_BIG),
                memberOf: { "@type": "Organization", name: "Hey.xyz" },
                name,
                url: `https://hey.xyz/g/${address}`
            };
        },
        cacheKey,
        ctx,
        extractData: (data) => data.group,
        query: generated_1.GroupDocument,
        variables: { request: { group: address } }
    });
};
exports.default = getGroup;
