"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@hey/data/enums");
const JwtService_1 = __importDefault(require("../services/JwtService"));
const generateTestJwt = async (c) => {
    try {
        const { walletAddress } = await c.req.json();
        if (!walletAddress) {
            return c.json({
                error: "walletAddress is required",
                status: enums_1.Status.Error,
                success: false
            }, 400);
        }
        // Generate a test JWT with the provided data
        const token = JwtService_1.default.generateToken({
            status: "Standard",
            walletAddress
        });
        return c.json({
            data: {
                status: "Standard",
                token,
                walletAddress
            },
            status: enums_1.Status.Success,
            success: true
        }, 200);
    }
    catch (error) {
        console.error("Error generating test JWT:", error);
        return c.json({
            error: error instanceof Error
                ? error.message
                : "Failed to generate test JWT",
            status: enums_1.Status.Error,
            success: false
        }, 500);
    }
};
exports.default = generateTestJwt;
