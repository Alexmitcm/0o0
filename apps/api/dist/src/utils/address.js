"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAddress = void 0;
const normalizeAddress = (address) => {
    if (!address) {
        throw new Error("Address is required");
    }
    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(`Invalid wallet address format: ${address}`);
    }
    return address.toLowerCase();
};
exports.normalizeAddress = normalizeAddress;
