import { useState, useEffect, useCallback, useRef } from 'react';

interface StateSyncOptions<T> {
  syncKey?: string;
  debounceMs?: number;
  validate?: (value: T) => boolean;
  transform?: (value: T) => T;
  onSync?: (value: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing state synchronization across components
 */
export const useStateSync = <T>(
  initialValue: T,
  options: StateSyncOptions<T> = {}
) => {
  const {
    syncKey,
    debounceMs = 300,
    validate,
    transform,
    onSync,
    onError,
  } = options;

  const [value, setValue] = useState<T>(initialValue);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const syncRef = useRef<boolean>(false);

  // Debounced sync function
  const debouncedSync = useCallback((newValue: T) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      syncValue(newValue);
    }, debounceMs);
  }, [debounceMs]);

  // Sync value function
  const syncValue = useCallback(async (newValue: T) => {
    if (syncRef.current) return; // Prevent concurrent syncs
    
    try {
      syncRef.current = true;
      setIsSyncing(true);
      setError(null);

      // Validate value if validator provided
      if (validate && !validate(newValue)) {
        throw new Error('Value validation failed');
      }

      // Transform value if transformer provided
      const transformedValue = transform ? transform(newValue) : newValue;

      // Update local state
      setValue(transformedValue);
      setLastSyncTime(Date.now());

      // Call sync callback
      onSync?.(transformedValue);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsSyncing(false);
      syncRef.current = false;
    }
  }, [validate, transform, onSync, onError]);

  // Update value with sync
  const updateValue = useCallback((newValue: T) => {
    if (debounceMs > 0) {
      debouncedSync(newValue);
    } else {
      syncValue(newValue);
    }
  }, [debounceMs, debouncedSync, syncValue]);

  // Force sync current value
  const forceSync = useCallback(() => {
    syncValue(value);
  }, [value, syncValue]);

  // Reset to initial value
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setIsSyncing(false);
  }, [initialValue]);

  // Listen for external changes (if syncKey provided)
  useEffect(() => {
    if (!syncKey) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === syncKey && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setValue(newValue);
        } catch (err) {
          console.error('Failed to parse synced value:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncKey]);

  // Sync to localStorage (if syncKey provided)
  useEffect(() => {
    if (!syncKey) return;

    try {
      localStorage.setItem(syncKey, JSON.stringify(value));
    } catch (err) {
      console.error('Failed to sync to localStorage:', err);
    }
  }, [value, syncKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue: updateValue,
    isSyncing,
    error,
    lastSyncTime,
    forceSync,
    reset,
  };
};

/**
 * Hook for managing multiple related states
 */
export const useMultiStateSync = <T extends Record<string, any>>(
  initialState: T,
  options: StateSyncOptions<T> = {}
) => {
  const [states, setStates] = useState<T>(initialState);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateState = useCallback(<K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    setStates(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateMultipleStates = useCallback((updates: Partial<T>) => {
    setStates(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetState = useCallback((key?: keyof T) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: initialState[key],
      }));
      setErrors(prev => ({
        ...prev,
        [key]: undefined,
      }));
    } else {
      setStates(initialState);
      setErrors({});
    }
  }, [initialState]);

  const setError = useCallback(<K extends keyof T>(
    key: K,
    error: string | null
  ) => {
    setErrors(prev => ({
      ...prev,
      [key]: error || undefined,
    }));
  }, []);

  return {
    states,
    updateState,
    updateMultipleStates,
    resetState,
    isSyncing,
    errors,
    setError,
  };
};

/**
 * Hook for managing async state with retry logic
 */
export const useAsyncStateSync = <T>(
  initialValue: T,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
  } = options;

  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (
    asyncFn: () => Promise<T>
  ) => {
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await asyncFn();
        setValue(result);
        setRetryCount(0);
        return result;
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Async operation failed');
        
        if (currentRetry < maxRetries) {
          currentRetry++;
          setRetryCount(currentRetry);
          onRetry?.(currentRetry);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetry));
        } else {
          setError(error.message);
          throw error;
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [maxRetries, retryDelay, onRetry]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setRetryCount(0);
    setIsLoading(false);
  }, [initialValue]);

  return {
    value,
    setValue,
    isLoading,
    error,
    retryCount,
    executeWithRetry,
    reset,
  };
};
