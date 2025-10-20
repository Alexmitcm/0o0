import { useCallback, useState } from "react";

export interface LoadingStatesState {
  isLoading: boolean;
  loadingMessage: string | null;
  progress: number;
}

export interface LoadingStatesActions {
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  clearLoading: () => void;
}

export const useLoadingStates = (): LoadingStatesState & LoadingStatesActions => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    setLoadingMessage(message || null);
    if (!loading) {
      setProgress(0);
    }
  }, []);

  const setProgressValue = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  const clearLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(null);
    setProgress(0);
  }, []);

  return {
    // State
    isLoading,
    loadingMessage,
    progress,
    
    // Actions
    setLoading,
    setProgress: setProgressValue,
    clearLoading
  };
};