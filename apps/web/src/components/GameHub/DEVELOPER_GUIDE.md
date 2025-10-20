# 🛠️ GameHub Developer Guide

A comprehensive guide for developers working on the GameHub platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Component Development](#component-development)
- [Access Control System](#access-control-system)
- [State Management](#state-management)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Analytics Integration](#analytics-integration)
- [Deployment](#deployment)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher
- **TypeScript**: 5.0.0 or higher
- **React**: 18.0.0 or higher

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd hey

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm biome:check

# Run tests
pnpm test
```

### Project Structure

```
apps/web/src/components/GameHub/
├── index.tsx                    # Main GameHub export
├── ProgressiveGameHub.tsx      # Core progressive component
├── GameHubGuest.tsx           # Guest mode implementation
├── GameHubSkeleton.tsx        # Loading states
├── ErrorBoundary.tsx          # Error boundary wrapper
├── hooks/
│   └── useAccessControl.tsx   # Access control hook
├── types/
│   └── access.ts              # Type definitions
├── components/                # Sub-components
│   ├── AccessControl/         # Access control components
│   ├── Smart/                 # Smart components
│   ├── Guest/                 # Guest mode components
│   ├── Progressive/           # Progressive disclosure
│   └── Optimization/          # Performance components
└── sections/                  # Content sections
    ├── LikedGamesStrip.tsx
    ├── PopularStrip.tsx
    └── TrendingStrip.tsx
```

## 🏗️ Architecture Overview

### Core Principles

1. **Progressive Enhancement**: Features are revealed based on user access level
2. **Access Control First**: All components respect user permissions
3. **Performance Optimized**: Lazy loading and efficient rendering
4. **Error Resilient**: Graceful error handling and recovery
5. **Analytics Driven**: Comprehensive tracking and monitoring

### Component Hierarchy

```
GameHub (Root)
├── ProgressiveGameHub (Orchestrator)
│   ├── GameHubHeader (Navigation)
│   ├── GameHubSideNav (Sidebar)
│   ├── GameHubHero (Featured Game)
│   ├── ConditionalRender (Access Control)
│   │   ├── TrendingStrip
│   │   ├── PopularStrip
│   │   └── LikedGamesStrip
│   ├── GameHubFeed (Game Grid)
│   ├── AdIntegration (Ads)
│   ├── UpgradeBanner (Upgrade Prompts)
│   ├── RewardsDashboard (Rewards)
│   └── SmartCTA (Call-to-Actions)
├── GameHubGuest (Guest Mode)
│   ├── GuestGameCard
│   ├── GuestGamePlayer
│   ├── GuestLimitations
│   └── GuestOnboarding
└── Optimization Components
    ├── PerformanceMonitor
    ├── ErrorRecovery
    ├── AnalyticsTracker
    ├── LoadingOptimizer
    └── TestSuite
```

## 🧩 Component Development

### Component Structure

Every component should follow this structure:

```tsx
import React from 'react';
import { ComponentProps } from './types';

interface ComponentNameProps {
  // Props interface
}

const ComponentName = ({ 
  prop1, 
  prop2, 
  className = "" 
}: ComponentNameProps) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render helpers

  return (
    <div className={`base-classes ${className}`}>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Component Guidelines

1. **TypeScript First**: Always define proper interfaces
2. **Accessibility**: Include ARIA attributes and keyboard navigation
3. **Responsive Design**: Use Tailwind responsive classes
4. **Error Boundaries**: Wrap components that might fail
5. **Performance**: Use React.memo for expensive components
6. **Testing**: Include data-testid attributes

### Example Component

```tsx
import React, { useState, useEffect } from 'react';
import { AdvancedButton } from '@/components/DesignSystem/AdvancedComponents';
import { useAccessControl } from '@/hooks/useAccessControl';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  className?: string;
}

const GameCard = ({ game, onPlay, className = "" }: GameCardProps) => {
  const { canAccess } = useAccessControl();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    if (!canAccess('canPlayGames')) {
      // Show upgrade prompt
      return;
    }

    setIsLoading(true);
    try {
      await onPlay(game);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`game-card ${className}`}
      data-testid="game-card"
    >
      <img 
        src={game.coverImageUrl} 
        alt={game.title}
        className="w-full h-48 object-cover rounded-lg"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">
          {game.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {game.description}
        </p>
        <AdvancedButton
          onClick={handlePlay}
          loading={isLoading}
          disabled={!canAccess('canPlayGames')}
          className="w-full mt-4"
        >
          {canAccess('canPlayGames') ? 'Play' : 'Upgrade to Play'}
        </AdvancedButton>
      </div>
    </div>
  );
};

export default React.memo(GameCard);
```

## 🔐 Access Control System

### Access Levels

```tsx
enum UserAccessLevel {
  GUEST = "guest",        // No authentication
  STANDARD = "standard",  // Basic authenticated user
  PREMIUM = "premium",    // Premium subscriber
  ADMIN = "admin"         // System administrator
}
```

### Permission System

```tsx
interface AccessPermissions {
  canPlayGames: boolean;
  canPlayPremiumGames: boolean;
  canEarnRewards: boolean;
  canAccessTournaments: boolean;
  canUploadGames: boolean;
  canViewRewards: boolean;
  canManageUsers: boolean;
}
```

### Using Access Control

```tsx
import { useAccessControl } from '@/hooks/useAccessControl';

const MyComponent = () => {
  const { 
    accessLevel, 
    isGuest, 
    isStandard, 
    isPremium, 
    canAccess 
  } = useAccessControl();

  return (
    <div>
      {canAccess('canPlayPremiumGames') && (
        <PremiumGameContent />
      )}
      
      {isGuest && (
        <GuestUpgradePrompt />
      )}
    </div>
  );
};
```

### Conditional Rendering

```tsx
import { ConditionalRender } from '@/components/GameHub/ConditionalRender';

<ConditionalRender 
  accessLevel={[UserAccessLevel.STANDARD, UserAccessLevel.PREMIUM]}
  fallback={<UpgradePrompt />}
>
  <PremiumContent />
</ConditionalRender>
```

## 📊 State Management

### Zustand Stores

```tsx
// Auth Modal Store
interface AuthModalStore {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

// User Store
interface UserStore {
  user: User | null;
  accessLevel: UserAccessLevel;
  setUser: (user: User | null) => void;
  setAccessLevel: (level: UserAccessLevel) => void;
}
```

### React Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch games
const { data: games, isLoading, error } = useQuery({
  queryKey: ['games', { category, search, sortBy }],
  queryFn: () => fetchGames({ category, search, sortBy }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Play game mutation
const playGameMutation = useMutation({
  mutationFn: playGame,
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});
```

## 🧪 Testing Guidelines

### Test Structure

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  const mockGame = {
    id: '1',
    title: 'Test Game',
    description: 'A test game',
    gameType: 'FreeToPlay' as const,
    coverImageUrl: '/test.jpg',
    gameFileUrl: '/game.html',
    playCount: 100,
    rating: 4.5,
    slug: 'test-game'
  };

  it('renders game information correctly', () => {
    render(<GameCard game={mockGame} onPlay={jest.fn()} />);
    
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('A test game')).toBeInTheDocument();
  });

  it('calls onPlay when play button is clicked', () => {
    const mockOnPlay = jest.fn();
    render(<GameCard game={mockGame} onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByText('Play'));
    expect(mockOnPlay).toHaveBeenCalledWith(mockGame);
  });
});
```

### Test Data Attributes

Always include `data-testid` attributes for testing:

```tsx
<div data-testid="game-card">
  <button data-testid="play-button">Play</button>
</div>
```

### Mocking

```tsx
// Mock access control
jest.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({
    accessLevel: UserAccessLevel.STANDARD,
    canAccess: (feature: string) => feature === 'canPlayGames',
    isGuest: false,
    isStandard: true,
    isPremium: false,
  }),
}));

// Mock API calls
jest.mock('@/helpers/gameHub', () => ({
  fetchGames: jest.fn().mockResolvedValue({
    games: [mockGame],
    total: 1,
  }),
}));
```

## ⚡ Performance Optimization

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const GameHubGuest = lazy(() => import('./GameHubGuest'));

const GameHub = () => {
  return (
    <Suspense fallback={<GameHubSkeleton />}>
      <GameHubGuest />
    </Suspense>
  );
};
```

### Memoization

```tsx
import React, { memo, useMemo, useCallback } from 'react';

const GameCard = memo(({ game, onPlay }) => {
  const gameType = useMemo(() => 
    game.gameType === 'PlayToEarn' ? 'Premium' : 'Free'
  , [game.gameType]);

  const handlePlay = useCallback(() => {
    onPlay(game);
  }, [game, onPlay]);

  return (
    <div>
      <span>{gameType}</span>
      <button onClick={handlePlay}>Play</button>
    </div>
  );
});
```

### Image Optimization

```tsx
const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
```

## 🚨 Error Handling

### Error Boundaries

```tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorRecovery error={this.state.error!} />;
    }

    return this.props.children;
  }
}
```

### Error Recovery

```tsx
const ErrorRecovery = ({ error, onRetry, onReport }) => {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  return (
    <div className="error-recovery">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={handleRetry}>
        Try Again ({retryCount}/3)
      </button>
      <button onClick={() => onReport(error)}>
        Report Error
      </button>
    </div>
  );
};
```

## 📈 Analytics Integration

### Event Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const GameCard = ({ game }) => {
  const { trackEvent } = useAnalytics();

  const handlePlay = () => {
    trackEvent('game_play', {
      game_id: game.id,
      game_title: game.title,
      game_type: game.gameType,
    });
    
    // Play game logic
  };

  return (
    <div>
      <button onClick={handlePlay}>Play</button>
    </div>
  );
};
```

### Performance Tracking

```tsx
const PerformanceTracker = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          trackEvent('page_load_time', {
            load_time: entry.loadEventEnd - entry.loadEventStart,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  return null;
};
```

## 🚀 Deployment

### Build Process

```bash
# Type checking
pnpm typecheck

# Linting
pnpm biome:check

# Testing
pnpm test

# Build
pnpm build
```

### Environment Variables

```env
# Production
NODE_ENV=production
REACT_APP_API_URL=https://api.gamehub.com
REACT_APP_ANALYTICS_ENABLED=true

# Development
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ANALYTICS_ENABLED=false
REACT_APP_DEBUG=true
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## 🔧 Debugging

### Debug Tools

1. **Performance Monitor**: Ctrl+Shift+P
2. **Test Suite**: Ctrl+Shift+T
3. **React DevTools**: Browser extension
4. **Redux DevTools**: State inspection

### Common Issues

#### Access Control Not Working
```tsx
// Check if user is properly authenticated
console.log('User:', user);
console.log('Access Level:', accessLevel);
console.log('Can Access:', canAccess('canPlayGames'));
```

#### Performance Issues
```tsx
// Check performance metrics
console.log('Performance:', performance.getEntriesByType('navigation'));
console.log('Memory:', performance.memory);
```

#### Component Not Rendering
```tsx
// Check conditional rendering
console.log('Access Level:', accessLevel);
console.log('Can Access:', canAccess('canViewContent'));
console.log('Is Guest:', isGuest);
```

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)

### Tools
- [Vite](https://vitejs.dev/)
- [Biome](https://biomejs.dev/)
- [Testing Library](https://testing-library.com/)
- [Storybook](https://storybook.js.org/)

### Best Practices
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Best Practices](https://web.dev/performance/)

---

**Happy Coding!** 🚀
