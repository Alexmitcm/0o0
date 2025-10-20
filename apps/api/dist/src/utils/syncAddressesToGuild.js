"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("@guildxyz/sdk");
const enums_1 = require("@hey/data/enums");
const logger_1 = require("@hey/helpers/logger");
const signer_1 = __importDefault(require("./signer"));
const guildClient = (0, sdk_1.createGuildClient)("heyxyz");
const signerFunction = sdk_1.createSigner.custom((message) => signer_1.default.signMessage({ message }), signer_1.default.account.address);
const { guild: { role: { requirement: requirementClient } } } = guildClient;
const syncAddressesToGuild = async ({ addresses, requirementId, roleId }) => {
    const log = (0, logger_1.withPrefix)("[API]");
    requirementClient
        .update(7465, roleId, requirementId, { data: { addresses, hideAllowlist: true }, visibility: "PUBLIC" }, signerFunction)
        .then(() => {
        log.info("Guild sync completed");
    })
        .catch((error) => {
        log.error("Guild sync failed:", error);
    });
    return {
        status: enums_1.Status.Success,
        total: addresses.length,
        updatedAt: new Date().toISOString()
    };
};
exports.default = syncAddressesToGuild;
