"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const lensPg_1 = __importDefault(require("@/utils/lensPg"));
const proMiddleware = async (c, next) => {
    const account = c.get("account");
    if (!account) {
        return c.body("Unauthorized", 401);
    }
    try {
        const groupMemberShip = (await lensPg_1.default.query(`
        SELECT account
        FROM "group"."member"
        WHERE "group" = $1 AND account = $2
        LIMIT 1;
      `, [
            `\\x${constants_1.PERMISSIONS.SUBSCRIPTION.replace("0x", "").toLowerCase()}`,
            `\\x${account.replace("0x", "").toLowerCase()}`
        ]));
        const canRequest = account === `0x${groupMemberShip[0].account.toString("hex")}`;
        if (!canRequest) {
            return c.body("Unauthorized", 401);
        }
        return next();
    }
    catch (error) {
        console.log(error);
        return c.body("Unauthorized", 401);
    }
};
exports.default = proMiddleware;
