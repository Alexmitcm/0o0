"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requirePremium = async (c, next) => {
    const isPremium = c.get("isPremium");
    const wallet = c.get("walletAddress");
    if (!wallet) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    if (!isPremium) {
        return c.json({ error: "Forbidden - Premium required" }, 403);
    }
    return next();
};
exports.default = requirePremium;
