export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;
  timestamp: Date;

  constructor(status: number, message: string, code?: string, details?: any) {
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

// HTTP Status Code Error Factories
export const badRequest = (
  message = "Bad request",
  code = "BAD_REQUEST",
  details?: any
) => new ApiError(400, message, code, details);

export const unauthorized = (
  message = "Unauthorized",
  code = "UNAUTHORIZED",
  details?: any
) => new ApiError(401, message, code, details);

export const forbidden = (
  message = "Forbidden",
  code = "FORBIDDEN",
  details?: any
) => new ApiError(403, message, code, details);

export const notFound = (
  message = "Not found",
  code = "NOT_FOUND",
  details?: any
) => new ApiError(404, message, code, details);

export const conflict = (
  message = "Conflict",
  code = "CONFLICT",
  details?: any
) => new ApiError(409, message, code, details);

export const unprocessableEntity = (
  message = "Unprocessable entity",
  code = "UNPROCESSABLE_ENTITY",
  details?: any
) => new ApiError(422, message, code, details);

export const tooManyRequests = (
  message = "Too many requests",
  code = "TOO_MANY_REQUESTS",
  details?: any
) => new ApiError(429, message, code, details);

export const internal = (
  message = "Internal error",
  code = "INTERNAL",
  details?: any
) => new ApiError(500, message, code, details);

export const serviceUnavailable = (
  message = "Service unavailable",
  code = "SERVICE_UNAVAILABLE",
  details?: any
) => new ApiError(503, message, code, details);

// Business Logic Error Factories
export const validationError = (message = "Validation failed", details?: any) =>
  badRequest(message, "VALIDATION_ERROR", details);

export const authenticationError = (
  message = "Authentication failed",
  details?: any
) => unauthorized(message, "AUTHENTICATION_ERROR", details);

export const authorizationError = (
  message = "Insufficient permissions",
  details?: any
) => forbidden(message, "AUTHORIZATION_ERROR", details);

export const resourceNotFound = (resource: string, id?: string) =>
  notFound(
    `${resource}${id ? ` with ID ${id}` : ""} not found`,
    "RESOURCE_NOT_FOUND",
    { id, resource }
  );

export const duplicateResource = (resource: string, field?: string) =>
  conflict(
    `${resource} already exists${field ? ` with ${field}` : ""}`,
    "DUPLICATE_RESOURCE",
    { field, resource }
  );

export const rateLimitExceeded = (retryAfter?: number) =>
  tooManyRequests("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", { retryAfter });

export const databaseError = (
  message = "Database operation failed",
  details?: any
) => internal(message, "DATABASE_ERROR", details);

export const externalServiceError = (
  service: string,
  message = "External service error",
  details?: any
) =>
  serviceUnavailable(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", {
    details,
    service
  });

// Error Handler Utility
export const handleError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    // Log the original error for debugging
    console.error("Unhandled error:", error);
    return internal("An unexpected error occurred", "UNHANDLED_ERROR", {
      message: error.message,
      stack: error.stack
    });
  }

  return internal("An unknown error occurred", "UNKNOWN_ERROR");
};
