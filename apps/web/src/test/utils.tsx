/**
 * Test utilities for React components
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => data,
        status: 200,
        statusText: 'OK',
      });
    }, delay);
  });
};

export const mockApiError = (status = 500, message = 'Internal Server Error') => {
  return Promise.resolve({
    ok: false,
    json: async () => ({ error: message }),
    status,
    statusText: message,
  });
};

// Mock game data
export const mockGame = {
  id: '1',
  title: 'Test Game',
  description: 'A test game for unit testing',
  thumb1Url: 'https://example.com/thumb.jpg',
  thumb2Url: 'https://example.com/icon.png',
  rating: 4.5,
  playCount: 1000,
  likeCount: 100,
  categories: [
    { id: '1', name: 'Action', slug: 'action' }
  ],
  tags: ['action', 'adventure'],
  slug: 'test-game',
  status: 'Published',
  isFeatured: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

export const mockGames = [
  mockGame,
  {
    ...mockGame,
    id: '2',
    title: 'Another Game',
    slug: 'another-game',
    rating: 3.8,
    playCount: 500,
    likeCount: 50
  }
];

// Mock user data
export const mockUser = {
  id: '1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  walletAddress: '0x1234567890abcdef',
  isPremium: false,
  createdAt: '2023-01-01T00:00:00Z'
};

// Mock performance metrics
export const mockPerformanceMetrics = {
  totalMetrics: 10,
  averageRenderTime: 12.5,
  averageApiTime: 800,
  slowComponents: ['HeavyComponent'],
  recommendations: ['Use React.memo()', 'Implement useMemo()']
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
