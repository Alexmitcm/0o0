"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const regex_1 = require("@hey/data/regex");
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authorization_1 = __importDefault(require("./authorization"));
const app = new hono_1.Hono();
app.post("/authorization", (0, zod_validator_1.zValidator)("json", zod_1.z.object({
    account: zod_1.z.string().regex(regex_1.Regex.evmAddress),
    signedBy: zod_1.z.string().regex(regex_1.Regex.evmAddress)
})), authorization_1.default);
exports.default = app;
