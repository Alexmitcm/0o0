"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getDbPostId = (decimal) => {
    if (!/^\d+$/.test(decimal)) {
        if (decimal === "") {
            return "";
        }
        throw new Error("Invalid decimal value");
    }
    return `\\x${BigInt(decimal).toString(16)}`;
};
exports.default = getDbPostId;
