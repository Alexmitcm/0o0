"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
class JwtService {
    secret;
    constructor() {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET environment variable is required but not set");
        }
        this.secret = jwtSecret;
    }
    /**
     * Generate JWT token with user data
     */
    generateToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, this.secret, {
                audience: "hey-pro-client",
                expiresIn: "7d", // Token expires in 7 days
                issuer: "hey-pro-api"
            });
            logger_1.default.debug(`JWT token generated for wallet: ${payload.walletAddress}`);
            return token;
        }
        catch (error) {
            logger_1.default.error("Error generating JWT token:", error);
            throw new Error("Failed to generate authentication token");
        }
    }
    /**
     * Verify and decode JWT token
     */
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret, {
                audience: "hey-pro-client",
                issuer: "hey-pro-api"
            });
            logger_1.default.debug(`JWT token verified for wallet: ${decoded.walletAddress}`);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger_1.default.warn("JWT token expired");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger_1.default.warn("Invalid JWT token");
            }
            else {
                logger_1.default.error("Error verifying JWT token:", error);
            }
            return null;
        }
    }
    /**
     * Decode JWT token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return decoded;
        }
        catch (error) {
            logger_1.default.error("Error decoding JWT token:", error);
            return null;
        }
    }
    /**
     * Refresh JWT token
     */
    refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            if (!decoded) {
                return null;
            }
            // Generate new token with same payload but new expiration
            const { iat: _iat, exp: _exp, ...payload } = decoded;
            return this.generateToken(payload);
        }
        catch (error) {
            logger_1.default.error("Error refreshing JWT token:", error);
            return null;
        }
    }
    /**
     * Get token expiration time
     */
    getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded.exp) {
                return null;
            }
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            logger_1.default.error("Error getting token expiration:", error);
            return null;
        }
    }
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        try {
            const expiration = this.getTokenExpiration(token);
            if (!expiration) {
                return true;
            }
            return expiration < new Date();
        }
        catch (error) {
            logger_1.default.error("Error checking token expiration:", error);
            return true;
        }
    }
}
exports.JwtService = JwtService;
exports.default = new JwtService();
