"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = {
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === "development") {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
    }
};
exports.default = logger;
