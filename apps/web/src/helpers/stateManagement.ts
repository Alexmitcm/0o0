/**
 * State Management Utilities
 * Helper functions for better state management and null/undefined handling
 */

export interface StateResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface StateActions<T> {
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Create a standardized state management hook
 */
export const createStateManager = <T>(initialData: T | null = null) => {
  return {
    data: initialData,
    loading: false,
    error: null,
  };
};

/**
 * Safe state update that prevents null/undefined issues
 */
export const safeStateUpdate = <T>(
  currentState: T | null,
  newState: T | null,
  fallback: T
): T => {
  if (newState !== null && newState !== undefined) {
    return newState;
  }
  return currentState || fallback;
};

/**
 * Check if state is in a valid state for rendering
 */
export const isValidState = <T>(state: StateResult<T>): boolean => {
  return !state.loading && !state.error && state.data !== null;
};

/**
 * Get display value with fallback
 */
export const getDisplayValue = <T>(
  value: T | null | undefined,
  fallback: string = "N/A"
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

/**
 * Safe array operations
 */
export const safeArray = <T>(arr: T[] | null | undefined): T[] => {
  return Array.isArray(arr) ? arr : [];
};

/**
 * Safe object operations
 */
export const safeObject = <T>(obj: T | null | undefined, fallback: T): T => {
  return obj || fallback;
};

/**
 * Debounced state update
 */
export const debounceStateUpdate = <T>(
  updateFn: (value: T) => void,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => updateFn(value), delay);
  };
};

/**
 * State validation helpers
 */
export const validateState = {
  isString: (value: unknown): value is string => {
    return typeof value === 'string' && value.length > 0;
  },
  
  isNumber: (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },
  
  isArray: (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  },
  
  isObject: (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
};

/**
 * Error handling utilities
 */
export const handleStateError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

/**
 * Loading state helpers
 */
export const createLoadingState = () => ({
  loading: true,
  error: null,
});

export const createErrorState = (error: string) => ({
  loading: false,
  error,
});

export const createSuccessState = <T>(data: T) => ({
  loading: false,
  error: null,
  data,
});
