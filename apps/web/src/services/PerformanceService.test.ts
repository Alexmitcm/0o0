/**
 * Unit tests for PerformanceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceService } from './PerformanceService';

// Mock performance.now
const mockNow = vi.fn();
Object.defineProperty(performance, 'now', {
  value: mockNow,
  writable: true
});

describe('PerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNow.mockReturnValue(1000);
    // Clear metrics between tests
    performanceService.clearOldMetrics(0);
  });

  it('should track render performance', () => {
    const component = 'TestComponent';
    const startTime = 1000;
    const endTime = 1016;

    mockNow.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

    performanceService.trackRender(component, startTime, endTime);

    const metrics = performanceService.getComponentMetrics(component);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].component).toBe(component);
    expect(metrics[0].type).toBe('render');
    expect(metrics[0].duration).toBe(16);
  });

  it('should track API call performance', () => {
    const endpoint = '/api/test';
    const startTime = 1000;
    const endTime = 1200;

    mockNow.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

    performanceService.trackApiCall(endpoint, startTime, endTime);

    const metrics = performanceService.getComponentMetrics(endpoint);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].component).toBe(endpoint);
    expect(metrics[0].type).toBe('api');
    expect(metrics[0].duration).toBe(200);
  });

  it('should track navigation performance', () => {
    const route = '/dashboard';
    const startTime = 1000;
    const endTime = 1100;

    mockNow.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

    performanceService.trackNavigation(route, startTime, endTime);

    const metrics = performanceService.getComponentMetrics(route);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].component).toBe(route);
    expect(metrics[0].type).toBe('navigation');
    expect(metrics[0].duration).toBe(100);
  });

  it('should track user interaction performance', () => {
    const action = 'button-click';
    const startTime = 1000;
    const endTime = 1005;

    mockNow.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

    performanceService.trackUserInteraction(action, startTime, endTime);

    const metrics = performanceService.getComponentMetrics(action);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].component).toBe(action);
    expect(metrics[0].type).toBe('user-interaction');
    expect(metrics[0].duration).toBe(5);
  });

  it('should generate performance summary', () => {
    // Add some test metrics
    performanceService.trackRender('Component1', 1000, 1010);
    performanceService.trackRender('Component2', 1000, 1030);
    performanceService.trackApiCall('/api/test', 1000, 1200);

    const summary = performanceService.getPerformanceSummary();

    expect(summary.totalMetrics).toBe(3);
    expect(summary.averageRenderTime).toBe(20); // (10 + 30) / 2
    expect(summary.averageApiTime).toBe(200);
    expect(summary.slowComponents).toContain('Component2');
    expect(summary.recommendations).toBeDefined();
  });

  it('should clear old metrics', () => {
    // Add some metrics
    performanceService.trackRender('Component1', 1000, 1010);
    performanceService.trackRender('Component2', 1000, 1010);

    let summary = performanceService.getPerformanceSummary();
    expect(summary.totalMetrics).toBe(2);

    // Clear metrics older than 0ms (all metrics)
    performanceService.clearOldMetrics(0);

    summary = performanceService.getPerformanceSummary();
    expect(summary.totalMetrics).toBe(0);
  });

  it('should set custom thresholds', () => {
    const customThresholds = {
      render: 8,
      api: 500,
      navigation: 200,
      memory: 50
    };

    performanceService.setThresholds(customThresholds);

    // The thresholds are internal, but we can test that the method doesn't throw
    expect(() => performanceService.setThresholds(customThresholds)).not.toThrow();
  });
});
