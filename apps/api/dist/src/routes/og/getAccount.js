"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const escapeHtml_1 = __importDefault(require("@hey/helpers/escapeHtml"));
const getAccount_1 = __importDefault(require("@hey/helpers/getAccount"));
const getAvatar_1 = __importDefault(require("@hey/helpers/getAvatar"));
const normalizeDescription_1 = __importDefault(require("@hey/helpers/normalizeDescription"));
const generated_1 = require("@hey/indexer/generated");
const html_1 = require("hono/html");
const ogUtils_1 = __importDefault(require("./ogUtils"));
const getAccount = async (ctx) => {
    const { username } = ctx.req.param();
    const cacheKey = `og:account:${username}`;
    return (0, ogUtils_1.default)({
        buildHtml: (account, escapedJsonLd) => {
            const { name, link, usernameWithPrefix } = (0, getAccount_1.default)(account);
            const title = `${name} (${usernameWithPrefix}) on Hey`;
            const description = (0, normalizeDescription_1.default)(account?.metadata?.bio, title);
            const avatar = (0, getAvatar_1.default)(account, constants_1.TRANSFORMS.AVATAR_BIG);
            const escTitle = (0, escapeHtml_1.default)(title);
            const escDescription = (0, escapeHtml_1.default)(description);
            const escName = (0, escapeHtml_1.default)(name);
            const escUsernameWithPrefix = (0, escapeHtml_1.default)(usernameWithPrefix);
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
            <meta property="og:url" content="https://hey.xyz${link}" />
            <meta property="og:image" content="${avatar}" />
            <meta property="og:logo" content="${constants_1.STATIC_IMAGES_URL}/app-icon/0.png" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="${escTitle}" />
            <meta name="twitter:description" content="${escDescription}" />
            <meta property="twitter:image" content="${avatar}" />
            <meta name="twitter:site" content="@heydotxyz" />
            <link rel="canonical" href="https://hey.xyz${link}" />
          </head>
          <body>
            <script type="application/ld+json">${(0, html_1.raw)(escapedJsonLd)}</script>
            <img src="${avatar}" alt="${escName}" height="100" width="100" />
            <h1>${escName || username}</h1>
            <h2>${escUsernameWithPrefix}</h2>
            <h3>${escDescription}</h3>
          </body>
        </html>
      `;
        },
        buildJsonLd: (account) => {
            const { name, usernameWithPrefix } = (0, getAccount_1.default)(account);
            const title = `${name} (${usernameWithPrefix}) on Hey`;
            const description = (0, normalizeDescription_1.default)(account?.metadata?.bio, title);
            return {
                "@context": "https://schema.org",
                "@id": `https://hey.xyz/u/${username}`,
                "@type": "Person",
                alternateName: username,
                description,
                image: (0, getAvatar_1.default)(account, constants_1.TRANSFORMS.AVATAR_BIG),
                memberOf: { "@type": "Organization", name: "Hey.xyz" },
                name,
                url: `https://hey.xyz/u/${username}`
            };
        },
        cacheKey,
        ctx,
        extractData: (data) => data.account,
        query: generated_1.AccountDocument,
        variables: { request: { username: { localName: username } } }
    });
};
exports.default = getAccount;
