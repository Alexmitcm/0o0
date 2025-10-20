"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const sha256 = (text) => {
    return (0, node_crypto_1.createHash)("sha256").update(text).digest("hex");
};
exports.default = sha256;
