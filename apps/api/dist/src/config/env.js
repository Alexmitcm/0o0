"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = exports.getEnvNumber = void 0;
const getEnvNumber = (name, defaultValue) => {
    const v = process.env[name];
    if (!v)
        return defaultValue;
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : defaultValue;
};
exports.getEnvNumber = getEnvNumber;
exports.CONFIG = {
    PREMIUM_STATUS_TTL_SECONDS: (0, exports.getEnvNumber)("PREMIUM_STATUS_TTL_SECONDS", 60 * 30)
};
