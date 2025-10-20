"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const enums_1 = require("@hey/data/enums");
const rpcs_1 = require("@hey/data/rpcs");
const hono_1 = require("hono");
const logger_1 = __importDefault(require("../utils/logger"));
const rpcRouter = new hono_1.Hono();
// Health check endpoint
rpcRouter.get("/", (c) => {
    return c.json({
        message: "RPC proxy is running",
        network: constants_1.IS_MAINNET ? "mainnet" : "testnet",
        status: "ok"
    });
});
// RPC proxy endpoint
rpcRouter.post("/", async (c) => {
    try {
        const body = await c.req.json();
        const rpcs = constants_1.IS_MAINNET ? rpcs_1.LENS_MAINNET_RPCS : rpcs_1.LENS_TESTNET_RPCS;
        logger_1.default.info(`RPC proxy request: ${constants_1.IS_MAINNET ? "mainnet" : "testnet"}, method: ${body.method}`);
        // Try each RPC endpoint until one succeeds
        for (const rpcUrl of rpcs) {
            try {
                logger_1.default.info(`Trying RPC endpoint: ${rpcUrl}`);
                const response = await fetch(rpcUrl, {
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "POST"
                });
                if (response.ok) {
                    const data = await response.json();
                    logger_1.default.info(`RPC request successful via: ${rpcUrl}`);
                    return c.json(data);
                }
            }
            catch {
                // Continue to next RPC if this one fails
                logger_1.default.warn(`RPC endpoint failed: ${rpcUrl}`);
            }
        }
        // If all RPCs fail, return error
        return c.json({
            error: "All RPC endpoints failed",
            status: enums_1.Status.Error
        }, 500);
    }
    catch {
        return c.json({
            error: "Invalid request body",
            status: enums_1.Status.Error
        }, 400);
    }
});
exports.default = rpcRouter;
