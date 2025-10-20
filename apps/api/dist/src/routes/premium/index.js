"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const v2_1 = __importDefault(require("./v2"));
const app = new hono_1.Hono();
// Mount v2 routes
app.route("/v2", v2_1.default);
exports.default = app;
