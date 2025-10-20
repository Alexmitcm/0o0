"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const enums_1 = require("@hey/data/enums");
const handleApiError_1 = __importDefault(require("../../../utils/handleApiError"));
const lensPg_1 = __importDefault(require("../../../utils/lensPg"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const signer_1 = __importDefault(require("../../../utils/signer"));
const ABI_1 = __importDefault(require("./ABI"));
const removeExpiredSubscribers = async (ctx) => {
    try {
        const accounts = (await lensPg_1.default.query(`
        SELECT account
        FROM "group"."member"
        WHERE "group" = $1
        AND timestamp < NOW() - INTERVAL '365 days'
        LIMIT 1000;
      `, [`\\x${constants_1.PERMISSIONS.SUBSCRIPTION.replace("0x", "").toLowerCase()}`]));
        const addresses = accounts.map((account) => `0x${account.account.toString("hex")}`.toLowerCase());
        if (addresses.length === 0) {
            return ctx.json({
                message: "No expired subscribers",
                status: enums_1.Status.Success
            });
        }
        // Run the removal operation in the background without awaiting
        const membersToRemove = addresses.map((addr) => ({
            account: addr,
            customParams: [],
            ruleProcessingParams: []
        }));
        signer_1.default
            .writeContract({
            abi: ABI_1.default,
            address: constants_1.PERMISSIONS.SUBSCRIPTION,
            args: [membersToRemove, []],
            functionName: "removeMembers"
        })
            .then((hash) => {
            logger_1.default.info("Expired subscribers removal completed", {
                count: addresses.length,
                hash
            });
        })
            .catch((error) => {
            logger_1.default.error("Expired subscribers removal failed:", error);
        });
        return ctx.json({
            addresses,
            processedAt: new Date().toISOString(),
            status: enums_1.Status.Success,
            total: addresses.length
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = removeExpiredSubscribers;
