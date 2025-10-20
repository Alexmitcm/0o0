"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeholderCoinBurner = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
// Placeholder implementation: validate and no-op. Records happen in the caller using Prisma.
// TODO: integrate with real coin system and deduct balance atomically.
exports.placeholderCoinBurner = {
    burnForTournament: async ({ amount }) => {
        if (!amount || !(amount instanceof decimal_js_1.default)) {
            return { message: "Invalid amount", ok: false };
        }
        if (amount.lte(0)) {
            return { message: "Amount must be positive", ok: false };
        }
        return { ok: true };
    }
};
