"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const html_1 = require("hono/html");
const defaultMetadata = (0, html_1.html) `
  <html>
    <head>
      <link rel="canonical" href="https://hey.xyz" />
      <link rel="icon" href="https://hey.xyz/favicon.ico" />
      <meta name="application-name" content="Hey" />
      <meta name="theme-color" content="${constants_1.BRAND_COLOR}" />
      <meta name="description" content="A decentralized, and permissionless social media app built with Lens" />
      <meta property="og:title" content="Hey" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Hey" />
      <meta property="og:image" content="${`${constants_1.STATIC_IMAGES_URL}/og/cover.png`}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@heydotxyz" />
      <title>Hey</title>
    </head>
    <body>
      <h1>Hey</h1>
      <p>A decentralized, and permissionless social media app built with Lens</p>
    </body>
  </html>
`;
exports.default = defaultMetadata;
