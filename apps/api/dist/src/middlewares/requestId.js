"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const requestId = async (c, next) => {
    const existing = c.req.header("x-request-id");
    const id = existing || (0, node_crypto_1.randomUUID)();
    c.set("requestId", id);
    c.header("x-request-id", id);
    return next();
};
exports.default = requestId;
