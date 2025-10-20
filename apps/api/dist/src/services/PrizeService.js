"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePrizes = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
const calculatePrizes = (participants, prizePool) => {
    const total = participants.reduce((acc, p) => acc.plus(p.coinsBurned), new decimal_js_1.default(0));
    if (total.lte(0)) {
        return participants.map((p) => ({
            ...p,
            prizeAmount: new decimal_js_1.default(0),
            prizeShareBps: 0
        }));
    }
    const provisional = participants.map((p) => {
        const ratio = p.coinsBurned.div(total);
        const bps = ratio
            .mul(10000)
            .toDecimalPlaces(0, decimal_js_1.default.ROUND_FLOOR)
            .toNumber();
        const amount = prizePool.mul(ratio);
        return { ...p, prizeAmount: amount, prizeShareBps: bps };
    });
    // Reconcile rounding: ensure total <= prizePool
    const sum = provisional.reduce((acc, p) => acc.plus(p.prizeAmount), new decimal_js_1.default(0));
    if (sum.lte(prizePool))
        return provisional;
    const factor = prizePool.div(sum);
    return provisional.map((p) => ({
        ...p,
        prizeAmount: p.prizeAmount.mul(factor)
    }));
};
exports.calculatePrizes = calculatePrizes;
