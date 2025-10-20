import { Status } from "@hey/data/enums";
import type { Context } from "hono";
import { ApiError, handleError } from "../errors/ApiError";
import type { AppContext } from "../types/context";
import logger from "../utils/logger";

export const errorHandler = async (err: Error, c: Context<AppContext>) => {
  const apiError = handleError(err);

  // Log the error with appropriate level
  if (apiError.status >= 500) {
    logger.error("Server error:", {
      code: apiError.code,
      details: apiError.details,
      error: apiError.message,
      method: c.req.method,
      path: c.req.path,
      requestId: c.get("requestId"),
      stack: err.stack,
      status: apiError.status
    });
  } else {
    logger.warn("Client error:", {
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
  return c.json(
    {
      status: Status.Error,
      success: false,
      ...apiError.toJSON()
    },
    apiError.status as any
  );
};

export const notFoundHandler = (c: Context<AppContext>) => {
  const apiError = new ApiError(404, "Endpoint not found", "NOT_FOUND", {
    method: c.req.method,
    path: c.req.path
  });

  logger.warn("404 Not Found:", {
    method: c.req.method,
    path: c.req.path,
    requestId: c.get("requestId")
  });

  return c.json(
    {
      status: Status.Error,
      success: false,
      ...apiError.toJSON()
    },
    404
  );
};
