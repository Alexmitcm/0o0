"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const enums_1 = require("@hey/data/enums");
const handleApiError_1 = __importDefault(require("@/utils/handleApiError"));
const lensPg_1 = __importDefault(require("@/utils/lensPg"));
const totalSubscribers = async (ctx) => {
    try {
        const accounts = (await lensPg_1.default.query(`
        SELECT DISTINCT ksw.owned_by
        FROM account.known_smart_wallet ksw
        INNER JOIN "group"."member" AS member ON ksw.address = member.account
        WHERE member."group" = $1;
      `, [`\\x${constants_1.PERMISSIONS.SUBSCRIPTION.replace("0x", "").toLowerCase()}`]));
        const addresses = accounts.map((account) => `0x${account.owned_by.toString("hex")}`.toLowerCase());
        return ctx.json({
            status: enums_1.Status.Success,
            total: addresses.length
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = totalSubscribers;
