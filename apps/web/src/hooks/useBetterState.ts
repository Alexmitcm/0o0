import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  StateResult, 
  StateActions, 
  safeStateUpdate, 
  isValidState, 
  getDisplayValue,
  handleStateError 
} from '@/helpers/stateManagement';

/**
 * Better state management hook with built-in null/undefined handling
 */
export const useBetterState = <T>(initialData: T | null = null) => {
  const [state, setState] = useState<StateResult<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data: safeStateUpdate(prev.data, data, prev.data as T),
      error: null,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
      error: loading ? null : prev.error,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error: error ? handleStateError(error) : null,
      loading: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const actions: StateActions<T> = {
    setData,
    setLoading,
    setError,
    reset,
  };

  return {
    ...state,
    isValid: isValidState(state),
    getDisplayValue: (fallback?: string) => getDisplayValue(state.data, fallback),
    actions,
  };
};

/**
 * Hook for managing async operations with better error handling
 */
export const useAsyncState = <T>(initialData: T | null = null) => {
  const state = useBetterState<T>(initialData);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeAsync = useCallback(async (
    asyncFn: (signal: AbortSignal) => Promise<T>,
    options?: { 
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
    }
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      state.actions.setLoading(true);
      state.actions.setError(null);

      const result = await asyncFn(signal);
      
      if (!signal.aborted) {
        state.actions.setData(result);
        options?.onSuccess?.(result);
      }
    } catch (error) {
      if (!signal.aborted) {
        const errorMessage = handleStateError(error);
        state.actions.setError(errorMessage);
        options?.onError?.(errorMessage);
      }
    } finally {
      if (!signal.aborted) {
        state.actions.setLoading(false);
      }
    }
  }, [state.actions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    executeAsync,
  };
};

/**
 * Hook for managing form state with validation
 */
export const useFormState = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const setTouchedField = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setError,
    setTouchedField,
    reset,
  };
};
