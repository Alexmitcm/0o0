"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.externalServiceError = exports.databaseError = exports.rateLimitExceeded = exports.duplicateResource = exports.resourceNotFound = exports.authorizationError = exports.authenticationError = exports.validationError = exports.serviceUnavailable = exports.internal = exports.tooManyRequests = exports.unprocessableEntity = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.ApiError = void 0;
class ApiError extends Error {
    status;
    code;
    details;
    timestamp;
    constructor(status, message, code, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                status: this.status,
                timestamp: this.timestamp.toISOString(),
                ...(this.details && { details: this.details })
            }
        };
    }
}
exports.ApiError = ApiError;
// HTTP Status Code Error Factories
const badRequest = (message = "Bad request", code = "BAD_REQUEST", details) => new ApiError(400, message, code, details);
exports.badRequest = badRequest;
const unauthorized = (message = "Unauthorized", code = "UNAUTHORIZED", details) => new ApiError(401, message, code, details);
exports.unauthorized = unauthorized;
const forbidden = (message = "Forbidden", code = "FORBIDDEN", details) => new ApiError(403, message, code, details);
exports.forbidden = forbidden;
const notFound = (message = "Not found", code = "NOT_FOUND", details) => new ApiError(404, message, code, details);
exports.notFound = notFound;
const conflict = (message = "Conflict", code = "CONFLICT", details) => new ApiError(409, message, code, details);
exports.conflict = conflict;
const unprocessableEntity = (message = "Unprocessable entity", code = "UNPROCESSABLE_ENTITY", details) => new ApiError(422, message, code, details);
exports.unprocessableEntity = unprocessableEntity;
const tooManyRequests = (message = "Too many requests", code = "TOO_MANY_REQUESTS", details) => new ApiError(429, message, code, details);
exports.tooManyRequests = tooManyRequests;
const internal = (message = "Internal error", code = "INTERNAL", details) => new ApiError(500, message, code, details);
exports.internal = internal;
const serviceUnavailable = (message = "Service unavailable", code = "SERVICE_UNAVAILABLE", details) => new ApiError(503, message, code, details);
exports.serviceUnavailable = serviceUnavailable;
// Business Logic Error Factories
const validationError = (message = "Validation failed", details) => (0, exports.badRequest)(message, "VALIDATION_ERROR", details);
exports.validationError = validationError;
const authenticationError = (message = "Authentication failed", details) => (0, exports.unauthorized)(message, "AUTHENTICATION_ERROR", details);
exports.authenticationError = authenticationError;
const authorizationError = (message = "Insufficient permissions", details) => (0, exports.forbidden)(message, "AUTHORIZATION_ERROR", details);
exports.authorizationError = authorizationError;
const resourceNotFound = (resource, id) => (0, exports.notFound)(`${resource}${id ? ` with ID ${id}` : ""} not found`, "RESOURCE_NOT_FOUND", { id, resource });
exports.resourceNotFound = resourceNotFound;
const duplicateResource = (resource, field) => (0, exports.conflict)(`${resource} already exists${field ? ` with ${field}` : ""}`, "DUPLICATE_RESOURCE", { field, resource });
exports.duplicateResource = duplicateResource;
const rateLimitExceeded = (retryAfter) => (0, exports.tooManyRequests)("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", { retryAfter });
exports.rateLimitExceeded = rateLimitExceeded;
const databaseError = (message = "Database operation failed", details) => (0, exports.internal)(message, "DATABASE_ERROR", details);
exports.databaseError = databaseError;
const externalServiceError = (service, message = "External service error", details) => (0, exports.serviceUnavailable)(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", {
    details,
    service
});
exports.externalServiceError = externalServiceError;
// Error Handler Utility
const handleError = (error) => {
    if (error instanceof ApiError) {
        return error;
    }
    if (error instanceof Error) {
        // Log the original error for debugging
        console.error("Unhandled error:", error);
        return (0, exports.internal)("An unexpected error occurred", "UNHANDLED_ERROR", {
            message: error.message,
            stack: error.stack
        });
    }
    return (0, exports.internal)("An unknown error occurred", "UNKNOWN_ERROR");
};
exports.handleError = handleError;
