"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const escapeHtml_1 = __importDefault(require("@hey/helpers/escapeHtml"));
const getAccount_1 = __importDefault(require("@hey/helpers/getAccount"));
const getAvatar_1 = __importDefault(require("@hey/helpers/getAvatar"));
const getPostData_1 = __importDefault(require("@hey/helpers/getPostData"));
const normalizeDescription_1 = __importDefault(require("@hey/helpers/normalizeDescription"));
const generated_1 = require("@hey/indexer/generated");
const html_1 = require("hono/html");
const ogUtils_1 = __importDefault(require("./ogUtils"));
const getPost = async (ctx) => {
    const { slug } = ctx.req.param();
    const cacheKey = `og:post:${slug}`;
    return (0, ogUtils_1.default)({
        buildHtml: (post, _jsonLd) => {
            const { author, metadata } = post;
            const { usernameWithPrefix } = (0, getAccount_1.default)(author);
            const filteredContent = (0, getPostData_1.default)(metadata)?.content || "";
            const title = `${post.__typename} by ${usernameWithPrefix} on Hey`;
            const description = (0, normalizeDescription_1.default)(filteredContent, title);
            const postUrl = `https://hey.xyz/posts/${post.slug}`;
            const escTitle = (0, escapeHtml_1.default)(title);
            const escDescription = (0, escapeHtml_1.default)(description);
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
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="Hey" />
            <meta property="og:url" content="https://hey.xyz/posts/${post.slug}" />
            <meta property="og:logo" content="${constants_1.STATIC_IMAGES_URL}/app-icon/0.png" />
            <meta property="og:image" content="${(0, getAvatar_1.default)(author, constants_1.TRANSFORMS.AVATAR_BIG)}" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="${escTitle}" />
            <meta name="twitter:description" content="${escDescription}" />
            <meta property="twitter:image" content="${(0, getAvatar_1.default)(author, constants_1.TRANSFORMS.AVATAR_BIG)}" />
            <meta name="twitter:site" content="@heydotxyz" />
            <link rel="canonical" href="https://hey.xyz/posts/${post.slug}" />
          </head>
          <body>
            <h1>${escTitle}</h1>
            <h2>${escDescription}</h2>
            <div>
              <b>Stats</b>
              <ul>
                <li><a href="${postUrl}">Collects: ${post.stats.collects}</a></li>
                <li><a href="${postUrl}">Tips: ${post.stats.tips}</a></li>
                <li><a href="${postUrl}">Comments: ${post.stats.comments}</a></li>
                <li><a href="${postUrl}">Likes: ${post.stats.reactions}</a></li>
                <li><a href="${postUrl}">Reposts: ${post.stats.reposts}</a></li>
                <li><a href="${postUrl}/quotes">Quotes: ${post.stats.quotes}</a></li>
              </ul>
            </div>
          </body>
        </html>
      `;
        },
        buildJsonLd: (post) => {
            const { author, metadata } = post;
            const { usernameWithPrefix } = (0, getAccount_1.default)(author);
            const filteredContent = (0, getPostData_1.default)(metadata)?.content || "";
            const title = `${post.__typename} by ${usernameWithPrefix} on Hey`;
            const description = (0, normalizeDescription_1.default)(filteredContent, title);
            return {
                "@context": "https://schema.org",
                "@id": `https://hey.xyz/posts/${post.slug}`,
                "@type": "Article",
                author: usernameWithPrefix,
                description,
                headline: title,
                image: (0, getAvatar_1.default)(author, constants_1.TRANSFORMS.AVATAR_BIG),
                publisher: { "@type": "Organization", name: "Hey.xyz" },
                url: `https://hey.xyz/posts/${post.slug}`
            };
        },
        cacheKey,
        ctx,
        extractData: (data) => data.post,
        query: generated_1.PostDocument,
        variables: { request: { post: slug } }
    });
};
exports.default = getPost;
