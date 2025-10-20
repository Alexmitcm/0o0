"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpcs_1 = require("@hey/data/rpcs");
const viem_1 = require("@lens-chain/sdk/viem");
const viem_2 = require("viem");
const accounts_1 = require("viem/accounts");
const account = (0, accounts_1.privateKeyToAccount)(process.env.PRIVATE_KEY);
const signer = (0, viem_2.createWalletClient)({
    account,
    chain: viem_1.chains.mainnet,
    transport: (0, viem_2.http)(rpcs_1.LENS_MAINNET_RPCS[0])
});
exports.default = signer;
