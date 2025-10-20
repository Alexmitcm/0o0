"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const enums_1 = require("@hey/data/enums");
const ApiError_1 = require("../errors/ApiError");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = async (err, c) => {
    const apiError = (0, ApiError_1.handleError)(err);
    // Log the error with appropriate level
    if (apiError.status >= 500) {
        logger_1.default.error("Server error:", {
            code: apiError.code,
            details: apiError.details,
            error: apiError.message,
            method: c.req.method,
            path: c.req.path,
            requestId: c.get("requestId"),
            stack: err.stack,
            status: apiError.status
        });
    }
    else {
        logger_1.default.warn("Client error:", {
            code: apiError.code,
            details: apiError.details,
            error: apiError.message,
            method: c.req.method,
            path: c.req.path,
            requestId: c.get("requestId"),
            status: apiError.status
        });
    }
    // Return appropriate response
    return c.json({
        status: enums_1.Status.Error,
        success: false,
        ...apiError.toJSON()
    }, apiError.status);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (c) => {
    const apiError = new ApiError_1.ApiError(404, "Endpoint not found", "NOT_FOUND", {
        method: c.req.method,
        path: c.req.path
    });
    logger_1.default.warn("404 Not Found:", {
        method: c.req.method,
        path: c.req.path,
        requestId: c.get("requestId")
    });
    return c.json({
        status: enums_1.Status.Error,
        success: false,
        ...apiError.toJSON()
    }, 404);
};
exports.notFoundHandler = notFoundHandler;
