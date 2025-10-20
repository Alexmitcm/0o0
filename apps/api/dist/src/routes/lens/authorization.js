"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@hey/data/enums");
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const authorization = async (ctx) => {
    try {
        const authHeader = ctx.req.raw.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return ctx.json({ error: "Unauthorized", status: enums_1.Status.Error }, 401);
        }
        const token = authHeader.split(" ")[1];
        if (token !== process.env.SHARED_SECRET) {
            return ctx.json({ error: "Invalid shared secret", status: enums_1.Status.Error }, 401);
        }
        return ctx.json({
            allowed: true,
            signingKey: process.env.PRIVATE_KEY,
            sponsored: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = authorization;
