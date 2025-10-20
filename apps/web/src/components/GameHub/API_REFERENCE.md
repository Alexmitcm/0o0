# 🔌 GameHub API Reference

Complete API documentation for the GameHub platform.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Access Control](#access-control)
- [Game Management](#game-management)
- [User Management](#user-management)
- [Rewards System](#rewards-system)
- [Analytics](#analytics)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

## 🔐 Authentication

### Authentication Flow

```typescript
// 1. Login with Lens Protocol
const loginWithLens = async (profileId: string) => {
  const response = await fetch('/api/auth/lens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId })
  });
  return response.json();
};

// 2. Link wallet to profile
const linkWallet = async (walletAddress: string, profileId: string) => {
  const response = await fetch('/api/auth/link-wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, profileId })
  });
  return response.json();
};

// 3. Check premium status
const checkPremiumStatus = async (walletAddress: string) => {
  const response = await fetch(`/api/auth/premium-status/${walletAddress}`);
  return response.json();
};
```

### Authentication Endpoints

#### POST `/api/auth/lens`
Authenticate with Lens Protocol.

**Request:**
```json
{
  "profileId": "0x1234...",
  "signature": "0xabcd...",
  "message": "Sign this message to authenticate"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "profileId": "0x1234...",
    "accessLevel": "standard",
    "isPremium": false
  }
}
```

#### POST `/api/auth/link-wallet`
Link a wallet to a Lens profile.

**Request:**
```json
{
  "walletAddress": "0xabcd...",
  "profileId": "0x1234...",
  "signature": "0xefgh..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet linked successfully"
}
```

#### GET `/api/auth/premium-status/:walletAddress`
Check premium status for a wallet.

**Response:**
```json
{
  "isPremium": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "tier": "premium"
}
```

## 🔐 Access Control

### Access Levels

```typescript
enum UserAccessLevel {
  GUEST = "guest",
  STANDARD = "standard", 
  PREMIUM = "premium",
  ADMIN = "admin"
}
```

### Permission System

```typescript
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

### Access Control Hooks

#### `useAccessControl()`
React hook for access control.

```typescript
const {
  accessLevel,
  isGuest,
  isStandard,
  isPremium,
  isAdmin,
  canAccess,
  getUpgradeMessage
} = useAccessControl();

// Usage
if (canAccess('canPlayPremiumGames')) {
  // Show premium games
}

if (isGuest) {
  // Show guest limitations
}
```

#### `ConditionalRender`
Component for conditional rendering based on access level.

```tsx
<ConditionalRender 
  accessLevel={[UserAccessLevel.STANDARD, UserAccessLevel.PREMIUM]}
  fallback={<UpgradePrompt />}
>
  <PremiumContent />
</ConditionalRender>
```

## 🎮 Game Management

### Game Types

```typescript
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
  category: string;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Game Endpoints

#### GET `/api/games`
Fetch games with filters.

**Query Parameters:**
- `category`: Filter by category
- `gameType`: Filter by game type (FreeToPlay, PlayToEarn)
- `featured`: Show only featured games
- `search`: Search by title or description
- `sortBy`: Sort by (newest, popular, rating, plays)
- `limit`: Number of games to return
- `offset`: Pagination offset

**Example:**
```typescript
const fetchGames = async (filters: GameFilters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/games?${params}`);
  return response.json();
};

// Usage
const games = await fetchGames({
  category: "action",
  gameType: "FreeToPlay",
  limit: 20,
  sortBy: "popular"
});
```

**Response:**
```json
{
  "games": [
    {
      "id": "game_123",
      "title": "Space Adventure",
      "description": "Explore the galaxy...",
      "gameType": "FreeToPlay",
      "coverImageUrl": "https://...",
      "gameFileUrl": "https://...",
      "playCount": 1500,
      "rating": 4.5,
      "slug": "space-adventure",
      "category": "action",
      "tags": ["space", "adventure", "arcade"],
      "featured": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

#### GET `/api/games/:id`
Get a specific game by ID.

**Response:**
```json
{
  "game": {
    "id": "game_123",
    "title": "Space Adventure",
    "description": "Explore the galaxy...",
    "gameType": "FreeToPlay",
    "coverImageUrl": "https://...",
    "gameFileUrl": "https://...",
    "playCount": 1500,
    "rating": 4.5,
    "slug": "space-adventure",
    "category": "action",
    "tags": ["space", "adventure", "arcade"],
    "featured": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/games/:id/play`
Record a game play session.

**Request:**
```json
{
  "gameId": "game_123",
  "duration": 300,
  "score": 1500,
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "rewards": {
    "xpCoins": 50,
    "usdt": 0.01
  },
  "achievements": [
    {
      "id": "first_play",
      "name": "First Play",
      "reward": 100
    }
  ]
}
```

#### POST `/api/games/:id/rate`
Rate a game.

**Request:**
```json
{
  "rating": 5,
  "review": "Great game! Loved the graphics."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating submitted successfully"
}
```

## 👤 User Management

### User Profile

```typescript
interface User {
  id: string;
  profileId: string;
  walletAddress: string;
  accessLevel: UserAccessLevel;
  isPremium: boolean;
  premiumExpiresAt?: string;
  totalPlayTime: number;
  totalEarnings: number;
  level: number;
  xp: number;
  createdAt: string;
  updatedAt: string;
}
```

### User Endpoints

#### GET `/api/user/profile`
Get current user profile.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "profileId": "0x1234...",
    "walletAddress": "0xabcd...",
    "accessLevel": "premium",
    "isPremium": true,
    "premiumExpiresAt": "2024-12-31T23:59:59Z",
    "totalPlayTime": 3600,
    "totalEarnings": 25.50,
    "level": 15,
    "xp": 2500,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/user/profile`
Update user profile.

**Request:**
```json
{
  "displayName": "Gamer123",
  "bio": "Love playing games!",
  "preferences": {
    "notifications": true,
    "emailUpdates": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "displayName": "Gamer123",
    "bio": "Love playing games!",
    "preferences": {
      "notifications": true,
      "emailUpdates": false
    }
  }
}
```

#### GET `/api/user/games`
Get user's game history.

**Query Parameters:**
- `limit`: Number of games to return
- `offset`: Pagination offset
- `gameType`: Filter by game type

**Response:**
```json
{
  "games": [
    {
      "game": {
        "id": "game_123",
        "title": "Space Adventure",
        "coverImageUrl": "https://...",
        "gameType": "FreeToPlay"
      },
      "playCount": 5,
      "totalTime": 300,
      "lastPlayed": "2024-01-01T12:00:00Z",
      "rating": 5
    }
  ],
  "total": 25,
  "hasMore": true
}
```

## 💰 Rewards System

### Reward Types

```typescript
interface Reward {
  id: string;
  type: "xp" | "usdt" | "achievement";
  amount: number;
  description: string;
  source: "game_play" | "tournament" | "daily_login" | "achievement";
  createdAt: string;
}
```

### Rewards Endpoints

#### GET `/api/rewards/balance`
Get user's reward balance.

**Response:**
```json
{
  "xpCoins": 1500,
  "usdt": 2.50,
  "totalEarnings": 25.50,
  "level": 15,
  "xpToNextLevel": 500
}
```

#### GET `/api/rewards/history`
Get reward history.

**Query Parameters:**
- `limit`: Number of rewards to return
- `offset`: Pagination offset
- `type`: Filter by reward type

**Response:**
```json
{
  "rewards": [
    {
      "id": "reward_123",
      "type": "xp",
      "amount": 50,
      "description": "Game play reward",
      "source": "game_play",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

#### POST `/api/rewards/withdraw`
Withdraw USDT to wallet.

**Request:**
```json
{
  "amount": 10.00,
  "walletAddress": "0xabcd...",
  "currency": "USDT"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "tx_123",
  "amount": 10.00,
  "walletAddress": "0xabcd...",
  "status": "pending",
  "estimatedTime": "24 hours"
}
```

#### GET `/api/rewards/withdrawals`
Get withdrawal history.

**Response:**
```json
{
  "withdrawals": [
    {
      "id": "withdrawal_123",
      "amount": 10.00,
      "walletAddress": "0xabcd...",
      "status": "completed",
      "transactionId": "tx_123",
      "createdAt": "2024-01-01T12:00:00Z",
      "completedAt": "2024-01-02T12:00:00Z"
    }
  ],
  "total": 5
}
```

## 📊 Analytics

### Analytics Events

```typescript
interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}
```

### Analytics Endpoints

#### POST `/api/analytics`
Track a single event.

**Request:**
```json
{
  "type": "game_interaction",
  "category": "game",
  "action": "play",
  "label": "Space Adventure",
  "value": 1,
  "timestamp": 1640995200000,
  "userId": "user_123",
  "sessionId": "session_456"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event_123"
}
```

#### POST `/api/analytics/batch`
Track multiple events.

**Request:**
```json
{
  "events": [
    {
      "type": "game_interaction",
      "category": "game",
      "action": "play",
      "label": "Space Adventure",
      "value": 1,
      "timestamp": 1640995200000,
      "userId": "user_123",
      "sessionId": "session_456"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processedEvents": 1,
  "failedEvents": 0
}
```

#### GET `/api/analytics/dashboard`
Get analytics dashboard data.

**Response:**
```json
{
  "userStats": {
    "totalGamesPlayed": 150,
    "totalPlayTime": 3600,
    "totalEarnings": 25.50,
    "favoriteCategory": "action",
    "averageRating": 4.2
  },
  "recentActivity": [
    {
      "type": "game_play",
      "game": "Space Adventure",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "achievements": [
    {
      "id": "achievement_123",
      "name": "Game Master",
      "description": "Played 100 games",
      "unlockedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## 🚨 Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Handling Example

```typescript
const handleApiCall = async () => {
  try {
    const response = await fetch('/api/games');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Handle error appropriately
  }
};
```

## ⚡ Rate Limits

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/games` | 100 requests | 1 minute |
| `/api/games/:id/play` | 10 requests | 1 minute |
| `/api/rewards/withdraw` | 5 requests | 1 hour |
| `/api/analytics` | 1000 requests | 1 minute |

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2024-01-01T12:01:00Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "req_123"
}
```

## 🔧 SDK Usage

### JavaScript SDK

```typescript
import { GameHubSDK } from '@gamehub/sdk';

const sdk = new GameHubSDK({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.gamehub.com'
});

// Fetch games
const games = await sdk.games.list({
  category: 'action',
  limit: 20
});

// Play a game
const result = await sdk.games.play('game_123', {
  duration: 300,
  score: 1500
});

// Track analytics
await sdk.analytics.track('game_play', {
  gameId: 'game_123',
  duration: 300
});
```

### React Hooks

```typescript
import { useGames, useRewards, useAnalytics } from '@gamehub/react';

const GameComponent = () => {
  const { games, loading, error } = useGames({
    category: 'action',
    limit: 20
  });
  
  const { balance, withdraw } = useRewards();
  const { track } = useAnalytics();
  
  const handlePlay = async (game) => {
    track('game_play', { gameId: game.id });
    // Play game logic
  };
  
  return (
    <div>
      {games.map(game => (
        <GameCard key={game.id} game={game} onPlay={handlePlay} />
      ))}
    </div>
  );
};
```

## 📚 Examples

### Complete Game Play Flow

```typescript
const playGame = async (gameId: string) => {
  try {
    // 1. Check access permissions
    const { canAccess } = useAccessControl();
    if (!canAccess('canPlayGames')) {
      throw new Error('Access denied');
    }
    
    // 2. Start game session
    const session = await fetch('/api/games/play', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ gameId })
    });
    
    // 3. Track analytics
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        type: 'game_interaction',
        category: 'game',
        action: 'play_start',
        label: gameId
      })
    });
    
    // 4. Game logic here...
    
    // 5. End game session
    const result = await fetch('/api/games/end', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        gameId,
        duration: 300,
        score: 1500,
        completed: true
      })
    });
    
    return result.json();
  } catch (error) {
    console.error('Game play error:', error);
    throw error;
  }
};
```

### Error Recovery Implementation

```typescript
const ErrorRecovery = ({ error, onRetry }) => {
  const [retryCount, setRetryCount] = useState(0);
  
  const handleRetry = async () => {
    if (retryCount >= 3) return;
    
    setRetryCount(prev => prev + 1);
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };
  
  return (
    <div className="error-recovery">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button 
        onClick={handleRetry}
        disabled={retryCount >= 3}
      >
        Try Again ({retryCount}/3)
      </button>
    </div>
  );
};
```

---

**GameHub API Reference** - Complete documentation for developers 🔌
