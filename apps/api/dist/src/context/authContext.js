"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parseJwt_1 = __importDefault(require("@hey/helpers/parseJwt"));
const authContext = async (ctx, next) => {
    const token = ctx.req.raw.headers.get("X-Access-Token");
    const payload = (0, parseJwt_1.default)(token);
    if (!payload.act.sub) {
        ctx.set("account", null);
        ctx.set("token", null);
        return next();
    }
    ctx.set("account", payload.act.sub);
    ctx.set("token", token);
    return next();
};
exports.default = authContext;
