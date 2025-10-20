"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const regex_1 = require("@hey/data/regex");
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const getAccount_1 = __importDefault(require("./getAccount"));
const getGroup_1 = __importDefault(require("./getGroup"));
const getPost_1 = __importDefault(require("./getPost"));
const app = new hono_1.Hono();
app.get("/u/:username", (0, zod_validator_1.zValidator)("param", zod_1.z.object({ username: zod_1.z.string() })), getAccount_1.default);
app.get("/posts/:slug", (0, zod_validator_1.zValidator)("param", zod_1.z.object({ slug: zod_1.z.string() })), getPost_1.default);
app.get("/g/:address", (0, zod_validator_1.zValidator)("param", zod_1.z.object({ address: zod_1.z.string().regex(regex_1.Regex.evmAddress) })), getGroup_1.default);
exports.default = app;
