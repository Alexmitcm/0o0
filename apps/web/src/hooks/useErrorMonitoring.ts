import { useCallback, useEffect } from "react";

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ErrorMonitoringConfig {
  enableLogging?: boolean;
  enableReporting?: boolean;
  reportEndpoint?: string;
  userId?: string;
  maxRetries?: number;
}

export const useErrorMonitoring = (config: ErrorMonitoringConfig = {}) => {
  const {
    enableLogging = true,
    enableReporting = false,
    reportEndpoint = "/api/errors",
    userId,
    maxRetries = 3
  } = config;

  // Report error to server
  const reportError = useCallback(
    async (error: ErrorReport, retryCount = 0) => {
      try {
        const response = await fetch(reportEndpoint, {
          body: JSON.stringify(error),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        if (!response.ok && retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = 2 ** retryCount * 1000;
          setTimeout(() => {
            reportError(error, retryCount + 1);
          }, delay);
        }
      } catch (reportError) {
        if (enableLogging) {
          console.error("Failed to report error:", reportError);
        }
      }
    },
    [reportEndpoint, maxRetries, enableLogging]
  );

  // Track error with context
  const trackError = useCallback(
    (
      error: Error,
      context?: {
        component?: string;
        action?: string;
        severity?: "low" | "medium" | "high" | "critical";
        metadata?: Record<string, any>;
      }
    ) => {
      const errorReport: ErrorReport = {
        component: context?.component,
        message: error.message,
        severity: context?.severity || "medium",
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId
      };

      if (enableLogging) {
        console.error(
          `Error${context?.component ? ` in ${context.component}` : ""}:`,
          {
            context: context?.action,
            error: error.message,
            metadata: context?.metadata,
            severity: errorReport.severity,
            stack: error.stack
          }
        );
      }

      if (enableReporting) {
        reportError(errorReport);
      }
    },
    [enableLogging, enableReporting, reportError, userId]
  );

  // Track React errors
  const trackReactError = useCallback(
    (error: Error, errorInfo: { componentStack: string }) => {
      trackError(error, {
        action: "componentDidCatch",
        component: "ReactErrorBoundary",
        metadata: {
          componentStack: errorInfo.componentStack
        },
        severity: "high"
      });
    },
    [trackError]
  );

  // Track API errors
  const trackApiError = useCallback(
    (
      error: Error,
      context: {
        endpoint: string;
        method: string;
        statusCode?: number;
        requestData?: any;
      }
    ) => {
      trackError(error, {
        action: `${context.method} ${context.endpoint}`,
        component: "API",
        metadata: {
          endpoint: context.endpoint,
          method: context.method,
          requestData: context.requestData,
          statusCode: context.statusCode
        },
        severity:
          context.statusCode && context.statusCode >= 500 ? "high" : "medium"
      });
    },
    [trackError]
  );

  // Track user interaction errors
  const trackUserError = useCallback(
    (error: Error, action: string, metadata?: Record<string, any>) => {
      trackError(error, {
        action,
        component: "UserInteraction",
        metadata,
        severity: "low"
      });
    },
    [trackError]
  );

  // Set up global error handlers
  useEffect(() => {
    if (!enableLogging && !enableReporting) return;

    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        action: "window.onerror",
        component: "Global",
        metadata: {
          colno: event.colno,
          filename: event.filename,
          lineno: event.lineno
        },
        severity: "high"
      });
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      trackError(error, {
        action: "unhandledrejection",
        component: "Global",
        metadata: {
          reason: event.reason
        },
        severity: "high"
      });
    };

    // Add event listeners
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [enableLogging, enableReporting, trackError]);

  return {
    trackApiError,
    trackError,
    trackReactError,
    trackUserError
  };
};

export default useErrorMonitoring;