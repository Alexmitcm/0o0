"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ping = (ctx) => {
    return ctx.json({ ping: "pong" });
};
exports.default = ping;
