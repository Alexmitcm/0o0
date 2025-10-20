"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_sts_1 = require("@aws-sdk/client-sts");
const constants_1 = require("@hey/data/constants");
const stsClient = new client_sts_1.STSClient({
    credentials: {
        accessKeyId: process.env.EVER_ACCESS_KEY,
        secretAccessKey: process.env.EVER_ACCESS_SECRET
    },
    endpoint: constants_1.EVER_API,
    region: constants_1.EVER_REGION
});
exports.default = stsClient;
