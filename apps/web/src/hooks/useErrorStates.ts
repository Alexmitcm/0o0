import { useCallback, useState } from "react";

export interface ErrorStatesState {
  error: string | null;
  hasError: boolean;
  errorType: "network" | "validation" | "permission" | "unknown" | null;
}

export interface ErrorStatesActions {
  setError: (error: string | null, type?: "network" | "validation" | "permission" | "unknown") => void;
  clearError: () => void;
  handleError: (error: Error | unknown) => void;
}

export const useErrorStates = (): ErrorStatesState & ErrorStatesActions => {
  const [error, setErrorState] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"network" | "validation" | "permission" | "unknown" | null>(null);

  const hasError = error !== null;

  const setError = useCallback((errorMessage: string | null, type: "network" | "validation" | "permission" | "unknown" = "unknown") => {
    setErrorState(errorMessage);
    setErrorType(errorMessage ? type : null);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setErrorType(null);
  }, []);

  const handleError = useCallback((error: Error | unknown) => {
    let errorMessage = "An unexpected error occurred";
    let type: "network" | "validation" | "permission" | "unknown" = "unknown";

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes("network") || error.message.includes("fetch")) {
        type = "network";
      } else if (error.message.includes("validation") || error.message.includes("invalid")) {
        type = "validation";
      } else if (error.message.includes("permission") || error.message.includes("unauthorized")) {
        type = "permission";
      }
    }

    setError(errorMessage, type);
  }, [setError]);

  return {
    // State
    error,
    hasError,
    errorType,
    
    // Actions
    setError,
    clearError,
    handleError
  };
};
