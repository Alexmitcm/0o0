"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssProtection = exports.sqlInjectionProtection = exports.requestSizeLimit = exports.enhancedRateLimit = exports.adminOnly = exports.ipWhitelist = exports.sanitizeRequest = exports.gameIframeErrorHandler = exports.securityHeaders = void 0;
const ApiError_1 = require("../errors/ApiError");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Security headers middleware
 */
const securityHeaders = async (c, next) => {
    // Security headers
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // CORS headers
    c.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:4783");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Max-Age", "86400");
    // Content Security Policy - allow iframes for games and external scripts
    c.header("Content-Security-Policy", "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; style-src 'self' 'unsafe-inline' https: http: data:; img-src 'self' data: https: http: blob:; font-src 'self' data: https: http:; connect-src 'self' https: http: wss: ws:; frame-ancestors 'self' http://localhost:* https://localhost:*; base-uri 'self'; form-action 'self';");
    // HSTS (only in production)
    if (process.env.NODE_ENV === "production") {
        c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    await next();
};
exports.securityHeaders = securityHeaders;
/**
 * Game iframe error handling middleware
 */
const gameIframeErrorHandler = async (c, next) => {
    // Add error handling for game iframes
    c.header("X-Frame-Options", "SAMEORIGIN");
    // Allow iframe embedding for games
    if (c.req.path.startsWith("/uploads/games/")) {
        c.header("X-Frame-Options", "ALLOWALL");
    }
    await next();
};
exports.gameIframeErrorHandler = gameIframeErrorHandler;
/**
 * Request sanitization middleware
 */
const sanitizeRequest = async (c, next) => {
    try {
        // Sanitize query parameters
        const query = c.req.query();
        const sanitizedQuery = {};
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === "string") {
                // Remove potentially dangerous characters
                sanitizedQuery[key] = value
                    .replace(/[<>]/g, "") // Remove < and >
                    .replace(/javascript:/gi, "") // Remove javascript: protocol
                    .replace(/on\w+=/gi, "") // Remove event handlers
                    .trim();
            }
        }
        // Store sanitized query for use in handlers
        c.set("sanitizedQuery", sanitizedQuery);
        // Sanitize headers
        const headers = c.req.header();
        const sanitizedHeaders = {};
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === "string") {
                // Remove potentially dangerous characters from header values
                sanitizedHeaders[key] = value
                    .replace(/[\r\n]/g, "") // Remove CRLF
                    .replace(/[<>]/g, "") // Remove < and >
                    .trim();
            }
        }
        c.set("sanitizedHeaders", sanitizedHeaders);
        await next();
    }
    catch (error) {
        logger_1.default.error("Request sanitization error:", error);
        await next();
    }
};
exports.sanitizeRequest = sanitizeRequest;
/**
 * Get client IP address
 */
function getClientIP(c) {
    return (c.req.header("cf-connecting-ip") ||
        c.req.header("x-real-ip") ||
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown");
}
/**
 * IP whitelist middleware
 */
const ipWhitelist = (allowedIPs) => {
    return async (c, next) => {
        const clientIP = getClientIP(c);
        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            logger_1.default.warn(`Blocked request from non-whitelisted IP: ${clientIP}`);
            return c.json({
                error: {
                    code: "IP_NOT_ALLOWED",
                    message: "Access denied from this IP address",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 403);
        }
        await next();
    };
};
exports.ipWhitelist = ipWhitelist;
/**
 * Admin-only middleware
 */
const adminOnly = async (c, next) => {
    // Check for admin JWT token
    const adminId = c.get("adminId");
    const adminType = c.get("adminType");
    if (!adminId || adminType !== "admin") {
        return c.json({
            error: {
                code: "ADMIN_AUTHENTICATION_REQUIRED",
                message: "Admin authentication required",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 401);
    }
    try {
        // For admin JWT tokens, we don't need to check AdminUser table
        // The JWT token already contains admin information
        logger_1.default.info(`Admin access granted for adminId: ${adminId}`);
        // Set admin user info in context for use in controllers
        c.set("adminUser", {
            id: adminId,
            permissions: ["admin"], // Admin JWT tokens have full admin permissions
            role: "admin"
        });
        await next();
    }
    catch (error) {
        logger_1.default.error("Error checking admin privileges:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to verify admin privileges",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.adminOnly = adminOnly;
/**
 * Rate limiting middleware with enhanced features
 */
const enhancedRateLimit = (_options) => {
    return async (_c, next) => {
        try {
            // This would integrate with your existing rate limiter
            // For now, we'll just pass through
            await next();
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("rate limit")) {
                throw (0, ApiError_1.rateLimitExceeded)();
            }
            throw error;
        }
    };
};
exports.enhancedRateLimit = enhancedRateLimit;
/**
 * Request size limiting middleware
 */
const requestSizeLimit = (maxSizeBytes) => {
    return async (c, next) => {
        const contentLength = c.req.header("content-length");
        if (contentLength) {
            const size = Number.parseInt(contentLength, 10);
            if (size > maxSizeBytes) {
                logger_1.default.warn(`Request too large: ${size} bytes (max: ${maxSizeBytes})`);
                return c.json({
                    error: {
                        code: "REQUEST_TOO_LARGE",
                        message: `Request size exceeds limit of ${maxSizeBytes} bytes`,
                        timestamp: new Date().toISOString()
                    },
                    success: false
                }, 413);
            }
        }
        await next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
/**
 * SQL injection protection middleware
 */
const sqlInjectionProtection = async (c, next) => {
    const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*IN\s*\([^)]*\))/gi,
        /(\b(OR|AND)\s+['"]\s*BETWEEN\s+[^)]*)/gi,
        /(\b(OR|AND)\s+['"]\s*EXISTS\s*\([^)]*\))/gi,
        /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\([^)]*\))/gi,
        /(\b(OR|AND)\s+['"]\s*IS\s+NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*IS\s+NOT\s+NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*OR\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*AND\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"]\s*UNION\s+ALL\s+SELECT\s+NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL,\s*NULL)/gi
    ];
    const checkForInjection = (input) => {
        return dangerousPatterns.some((pattern) => pattern.test(input));
    };
    try {
        // Check query parameters
        const query = c.req.query();
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === "string" && checkForInjection(value)) {
                logger_1.default.warn(`Potential SQL injection detected in query param ${key}: ${value}`);
                return c.json({
                    error: {
                        code: "SECURITY_VIOLATION",
                        message: "Potentially malicious input detected",
                        timestamp: new Date().toISOString()
                    },
                    success: false
                }, 400);
            }
        }
        // Check request body
        const body = await c.req.json().catch(() => null);
        if (body && typeof body === "object") {
            const checkObject = (obj, path = "") => {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (typeof value === "string" && checkForInjection(value)) {
                        logger_1.default.warn(`Potential SQL injection detected in body ${currentPath}: ${value}`);
                        return true;
                    }
                    if (typeof value === "object" && value !== null) {
                        if (checkObject(value, currentPath)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            if (checkObject(body)) {
                return c.json({
                    error: {
                        code: "SECURITY_VIOLATION",
                        message: "Potentially malicious input detected",
                        timestamp: new Date().toISOString()
                    },
                    success: false
                }, 400);
            }
        }
        await next();
    }
    catch (error) {
        logger_1.default.error("SQL injection protection error:", error);
        await next();
    }
};
exports.sqlInjectionProtection = sqlInjectionProtection;
/**
 * XSS protection middleware
 */
const xssProtection = async (c, next) => {
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
        /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*<\/input>/gi,
        /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
        /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
        /<option\b[^<]*(?:(?!<\/option>)<[^<]*)*<\/option>/gi,
        /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
        /<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi,
        /<img\b[^<]*(?:(?!<\/img>)<[^<]*)*<\/img>/gi,
        /<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi,
        /<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi,
        /<source\b[^<]*(?:(?!<\/source>)<[^<]*)*<\/source>/gi,
        /<track\b[^<]*(?:(?!<\/track>)<[^<]*)*<\/track>/gi,
        /<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi,
        /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
        /<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
        /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*<\/input>/gi,
        /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
        /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
        /<option\b[^<]*(?:(?!<\/option>)<[^<]*)*<\/option>/gi,
        /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
        /<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi,
        /<img\b[^<]*(?:(?!<\/img>)<[^<]*)*<\/img>/gi,
        /<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi,
        /<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi,
        /<source\b[^<]*(?:(?!<\/source>)<[^<]*)*<\/source>/gi,
        /<track\b[^<]*(?:(?!<\/track>)<[^<]*)*<\/track>/gi,
        /<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi,
        /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
        /<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi
    ];
    const checkForXSS = (input) => {
        return dangerousPatterns.some((pattern) => pattern.test(input));
    };
    try {
        // Check query parameters
        const query = c.req.query();
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === "string" && checkForXSS(value)) {
                logger_1.default.warn(`Potential XSS detected in query param ${key}: ${value}`);
                return c.json({
                    error: {
                        code: "SECURITY_VIOLATION",
                        message: "Potentially malicious input detected",
                        timestamp: new Date().toISOString()
                    },
                    success: false
                }, 400);
            }
        }
        // Check request body
        const body = await c.req.json().catch(() => null);
        if (body && typeof body === "object") {
            const checkObject = (obj, path = "") => {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (typeof value === "string" && checkForXSS(value)) {
                        logger_1.default.warn(`Potential XSS detected in body ${currentPath}: ${value}`);
                        return true;
                    }
                    if (typeof value === "object" && value !== null) {
                        if (checkObject(value, currentPath)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            if (checkObject(body)) {
                return c.json({
                    error: {
                        code: "SECURITY_VIOLATION",
                        message: "Potentially malicious input detected",
                        timestamp: new Date().toISOString()
                    },
                    success: false
                }, 400);
            }
        }
        await next();
    }
    catch (error) {
        logger_1.default.error("XSS protection error:", error);
        await next();
    }
};
exports.xssProtection = xssProtection;
