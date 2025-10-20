# 🎮 GameHub - Progressive Gaming Platform

A comprehensive gaming platform with multi-tier access control, progressive disclosure, and advanced user experience features.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Access Levels](#access-levels)
- [Components](#components)
- [Features](#features)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

GameHub is a modern gaming platform that provides:

- **Multi-tier Access Control**: Guest, Standard, Premium, Admin levels
- **Progressive Disclosure**: Content revealed based on user access level
- **Guest Mode**: Limited access without registration
- **Smart CTAs**: Context-aware call-to-action buttons
- **Performance Monitoring**: Real-time performance tracking
- **Error Recovery**: Intelligent error handling and recovery
- **Analytics**: Comprehensive user behavior tracking

## 🏗️ Architecture

### Core Components

```
GameHub/
├── index.tsx                    # Main GameHub component
├── ProgressiveGameHub.tsx      # Progressive disclosure wrapper
├── GameHubGuest.tsx           # Guest mode experience
├── GameHubSkeleton.tsx        # Loading states
├── ErrorBoundary.tsx          # Error handling
├── Access Control/
│   ├── useAccessControl.tsx   # Access control hook
│   ├── ConditionalRender.tsx  # Conditional rendering
│   └── FeatureLock.tsx        # Feature locking
├── Smart Components/
│   ├── SmartCTA.tsx           # Smart call-to-action
│   ├── SmartGameButton.tsx    # Intelligent game buttons
│   └── UpgradeFlow.tsx        # Upgrade flow
├── Guest Mode/
│   ├── GuestGameCard.tsx      # Guest game cards
│   ├── GuestGamePlayer.tsx    # Guest game player
│   ├── GuestLimitations.tsx   # Guest limitations
│   └── GuestOnboarding.tsx    # Guest onboarding
├── Progressive Disclosure/
│   └── ProgressiveDisclosure.tsx
├── Optimization/
│   ├── PerformanceMonitor.tsx # Performance tracking
│   ├── ErrorRecovery.tsx      # Error recovery
│   ├── AnalyticsTracker.tsx   # Analytics tracking
│   ├── LoadingOptimizer.tsx   # Loading optimization
│   └── TestSuite.tsx          # Automated testing
└── sections/
    ├── LikedGamesStrip.tsx    # Liked games section
    ├── PopularStrip.tsx       # Popular games section
    └── TrendingStrip.tsx      # Trending games section
```

## 🔐 Access Levels

### Guest Level
- **Access**: Free games only
- **Limitations**: 2-minute play sessions, no progress saving
- **Features**: Basic game browsing, limited interactions

### Standard Level
- **Access**: Free games + ads
- **Features**: Progress saving, social features, basic rewards
- **Upgrade Path**: Premium features preview

### Premium Level
- **Access**: All games, no ads
- **Features**: Full rewards, tournaments, unlimited play
- **Benefits**: Real USDT earnings, exclusive content

### Admin Level
- **Access**: All features + admin controls
- **Features**: User management, analytics, system controls

## 🧩 Components

### Core Components

#### `GameHub`
Main entry point that orchestrates the entire gaming experience.

```tsx
import GameHub from './components/GameHub';

<GameHub />
```

#### `ProgressiveGameHub`
Implements progressive disclosure based on user access level.

```tsx
<ProgressiveGameHub />
```

#### `GameHubGuest`
Guest mode experience with limited functionality.

```tsx
<GameHubGuest />
```

### Access Control Components

#### `useAccessControl`
Hook for managing user access levels and permissions.

```tsx
const { accessLevel, isGuest, isStandard, isPremium, canAccess } = useAccessControl();
```

#### `ConditionalRender`
Conditionally renders content based on access level.

```tsx
<ConditionalRender accessLevel={UserAccessLevel.PREMIUM}>
  <PremiumContent />
</ConditionalRender>
```

#### `FeatureLock`
Locks features behind access requirements.

```tsx
<FeatureLock feature="canPlayPremiumGames">
  <PremiumGame />
</FeatureLock>
```

### Smart Components

#### `SmartCTA`
Context-aware call-to-action buttons.

```tsx
<SmartCTA 
  feature="canPlayPremiumGames"
  variant="primary"
  size="lg"
/>
```

#### `SmartGameButton`
Intelligent game play buttons that adapt to user access.

```tsx
<SmartGameButton 
  game={game}
  variant="primary"
  onPlay={handlePlay}
/>
```

#### `UpgradeFlow`
Guided upgrade experience with feature previews.

```tsx
<UpgradeFlow 
  feature="canPlayPremiumGames"
  showPreview={true}
/>
```

### Guest Mode Components

#### `GuestGameCard`
Game cards optimized for guest users.

```tsx
<GuestGameCard 
  game={game}
  variant="default"
/>
```

#### `GuestGamePlayer`
Limited game player for guest users.

```tsx
<GuestGamePlayer 
  game={game}
  onClose={handleClose}
/>
```

#### `GuestLimitations`
Displays guest mode limitations and upgrade benefits.

```tsx
<GuestLimitations />
```

#### `GuestOnboarding`
Interactive onboarding for new guest users.

```tsx
<GuestOnboarding onComplete={handleComplete} />
```

### Progressive Disclosure

#### `ProgressiveDisclosure`
Collapsible content sections with access control.

```tsx
<ProgressiveDisclosure
  title="Rewards Dashboard"
  description="View your earnings and rewards"
  feature="canViewRewards"
>
  <RewardsDashboard />
</ProgressiveDisclosure>
```

### Optimization Components

#### `PerformanceMonitor`
Real-time performance monitoring (Ctrl+Shift+P).

```tsx
<PerformanceMonitor 
  gameCount={gameCount}
  errorCount={errorCount}
/>
```

#### `ErrorRecovery`
Intelligent error handling and recovery.

```tsx
<ErrorRecovery 
  error={error}
  onRetry={handleRetry}
  onReport={handleReport}
/>
```

#### `AnalyticsTracker`
Comprehensive analytics tracking.

```tsx
<AnalyticsTracker 
  sessionId={sessionId}
  userId={userId}
  enabled={true}
/>
```

#### `LoadingOptimizer`
Optimized loading experience.

```tsx
<LoadingOptimizer minLoadTime={500}>
  <GameContent />
</LoadingOptimizer>
```

#### `TestSuite`
Automated testing suite (Ctrl+Shift+T).

```tsx
<TestSuite />
```

## ✨ Features

### Multi-Tier Access Control
- **Guest Mode**: No registration required, limited features
- **Standard Mode**: Registered users with ads and basic features
- **Premium Mode**: Full access with no ads and exclusive content
- **Admin Mode**: Complete system access

### Progressive Disclosure
- Content revealed based on user access level
- Smooth transitions between access levels
- Context-aware feature presentation

### Smart CTAs
- Dynamic call-to-action buttons
- Context-aware messaging
- Seamless upgrade flows

### Guest Experience
- **Onboarding**: Interactive tour for new users
- **Limitations**: Clear explanation of restrictions
- **Upgrade Prompts**: Strategic upgrade suggestions
- **Time Limits**: 2-minute play sessions

### Performance Optimization
- **Loading States**: Skeleton screens and spinners
- **Error Boundaries**: Graceful error handling
- **Memory Management**: Efficient resource usage
- **Analytics**: Real-time performance tracking

### Testing & Monitoring
- **Automated Tests**: Comprehensive test suite
- **Performance Monitoring**: Real-time metrics
- **Error Tracking**: Detailed error reporting
- **Analytics**: User behavior insights

## 🚀 Usage

### Basic Implementation

```tsx
import { GameHub } from './components/GameHub';

function App() {
  return (
    <div className="App">
      <GameHub />
    </div>
  );
}
```

### Custom Access Control

```tsx
import { useAccessControl } from './hooks/useAccessControl';

function CustomComponent() {
  const { accessLevel, canAccess } = useAccessControl();
  
  return (
    <div>
      {canAccess('canPlayPremiumGames') && (
        <PremiumGameContent />
      )}
    </div>
  );
}
```

### Guest Mode Integration

```tsx
import { GameHubGuest } from './components/GameHub/GameHubGuest';

function GuestPage() {
  return <GameHubGuest />;
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm
- TypeScript
- React 18+

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Biome**: Fast linting and formatting

### File Structure

```
src/components/GameHub/
├── index.tsx                 # Main export
├── ProgressiveGameHub.tsx   # Core component
├── GameHubGuest.tsx        # Guest mode
├── hooks/
│   └── useAccessControl.tsx # Access control hook
├── types/
│   └── access.ts           # Type definitions
└── components/             # Sub-components
```

## 🧪 Testing

### Test Suite

The built-in test suite can be accessed with `Ctrl+Shift+T`:

- **Access Control Tests**: Verify permission system
- **Game Loading Tests**: Check game loading functionality
- **Performance Tests**: Validate performance metrics
- **Error Handling Tests**: Test error recovery
- **Responsive Tests**: Verify mobile compatibility

### Manual Testing

1. **Guest Mode**: Test without authentication
2. **Standard Mode**: Test with basic account
3. **Premium Mode**: Test with premium account
4. **Error Scenarios**: Test error handling
5. **Performance**: Monitor loading times

### Automated Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:gamehub

# Run performance tests
pnpm test:performance
```

## 📊 Performance

### Metrics Tracked

- **Load Time**: Page and component load times
- **Render Time**: Component rendering performance
- **Memory Usage**: JavaScript heap usage
- **Error Rate**: Error frequency and types
- **User Interactions**: Click tracking and behavior

### Optimization Strategies

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Bundle optimization
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Smart caching strategies
- **Compression**: Gzip/Brotli compression

### Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Memory Usage**: < 50MB

## 🔧 Troubleshooting

### Common Issues

#### Access Control Not Working
```tsx
// Check if useAccessControl is properly configured
const { accessLevel, canAccess } = useAccessControl();
console.log('Current access level:', accessLevel);
```

#### Guest Mode Not Loading
```tsx
// Verify guest mode components are imported
import { GameHubGuest } from './components/GameHub/GameHubGuest';
```

#### Performance Issues
- Check Performance Monitor (Ctrl+Shift+P)
- Review console for errors
- Verify image optimization
- Check network requests

#### Test Failures
- Run Test Suite (Ctrl+Shift+T)
- Check browser console
- Verify component data-testid attributes
- Review test logs

### Debug Mode

Enable debug mode for detailed logging:

```tsx
// Add to environment variables
REACT_APP_DEBUG=true
REACT_APP_ANALYTICS_DEBUG=true
```

### Error Reporting

Errors are automatically tracked and can be reported:

```tsx
// Manual error reporting
window.analytics?.trackError(error, 'custom-context');
```

## 📚 API Reference

### Hooks

#### `useAccessControl()`
Returns access control state and methods.

```tsx
interface AccessControlReturn {
  accessLevel: UserAccessLevel;
  isGuest: boolean;
  isStandard: boolean;
  isPremium: boolean;
  canAccess: (feature: string) => boolean;
  getUpgradeMessage: (feature: string) => string;
}
```

#### `useAuthModalStore()`
Manages authentication modal state.

```tsx
interface AuthModalStore {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}
```

### Types

#### `UserAccessLevel`
```tsx
enum UserAccessLevel {
  GUEST = "guest",
  STANDARD = "standard", 
  PREMIUM = "premium",
  ADMIN = "admin"
}
```

#### `Game`
```tsx
interface Game {
  id: string;
  title: string;
  description: string;
  gameType: "FreeToPlay" | "PlayToEarn";
  coverImageUrl: string;
  gameFileUrl: string;
  playCount: number;
  rating: number;
  slug: string;
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Maintain performance standards
- Follow accessibility guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@gamehub.com

---

**GameHub** - Progressive Gaming Platform 🎮
