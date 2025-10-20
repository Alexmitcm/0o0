/**
 * Unit tests for usePerformanceApi hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePerformanceApi, usePerformanceMutation } from './usePerformanceApi';

// Mock the performance API client
vi.mock('../lib/api/PerformanceApiClient', () => ({
  performanceApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    clearCache: vi.fn()
  }
}));

// Mock the performance service
vi.mock('../services/PerformanceService', () => ({
  performanceService: {
    trackApiCall: vi.fn(),
    trackRender: vi.fn()
  }
}));

describe('usePerformanceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    vi.mocked(performanceApiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => 
      usePerformanceApi('/api/test')
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    vi.mocked(performanceApiClient.get).mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      usePerformanceApi('/api/test')
    );

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  it('should refetch data when refetch is called', async () => {
    const mockData = { id: '1', name: 'Test' };
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    vi.mocked(performanceApiClient.get).mockResolvedValue(mockData);

    const { result } = renderHook(() => 
      usePerformanceApi('/api/test')
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    // Call refetch
    await result.current.refetch();

    expect(performanceApiClient.get).toHaveBeenCalledTimes(2);
  });

  it('should clear cache when clearCache is called', async () => {
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    const { result } = renderHook(() => 
      usePerformanceApi('/api/test')
    );

    result.current.clearCache();

    expect(performanceApiClient.clearCache).toHaveBeenCalled();
  });

  it('should not fetch when URL is null', async () => {
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    renderHook(() => usePerformanceApi(null));

    expect(performanceApiClient.get).not.toHaveBeenCalled();
  });
});

describe('usePerformanceMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute mutation successfully', async () => {
    const mockData = { id: '1', name: 'Created' };
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    vi.mocked(performanceApiClient.post).mockResolvedValue(mockData);

    const { result } = renderHook(() => usePerformanceMutation());

    await result.current.mutate('/api/create', { name: 'Test' });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle mutation errors', async () => {
    const mockError = new Error('Mutation Error');
    const { performanceApiClient } = await import('../lib/api/PerformanceApiClient');
    
    vi.mocked(performanceApiClient.post).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePerformanceMutation());

    await result.current.mutate('/api/create', { name: 'Test' });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });
});
