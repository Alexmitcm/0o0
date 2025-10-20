# راهنمای استفاده از Hook های Game Hub

این Hook های ساده برای مدیریت Game Hub ساخته شده‌اند.

## Hook های موجود

### 1. useGameHubSimple

برای مدیریت state اصلی Game Hub (فیلترها، جستجو، مرتب‌سازی)

```tsx
import { useGameHubSimple } from '@/hooks/useGameHubSimple';

function GameHub() {
  const {
    // State
    selectedCategory,
    searchQuery,
    sortBy,
    showFeatured,
    mobileMenuOpen,
    isLoading,
    error,
    
    // Actions
    setSelectedCategory,
    setSearchQuery,
    setSortBy,
    setShowFeatured,
    setMobileMenuOpen,
    setLoading,
    setError,
    clearFilters,
    syncParams
  } = useGameHubSimple();

  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="جستجوی بازی..."
      />
      
      <select 
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="newest">جدیدترین</option>
        <option value="popular">محبوب‌ترین</option>
        <option value="rating">بهترین امتیاز</option>
        <option value="plays">بیشترین بازی</option>
      </select>
      
      <button onClick={clearFilters}>پاک کردن فیلترها</button>
    </div>
  );
}
```

### 2. useGameActions

برای مدیریت اکشن‌های بازی (لایک، دیسلایک، رتبه‌دهی)

```tsx
import { useGameActions } from '@/hooks/useGameActions';

function GameCard({ gameId }) {
  const {
    // State
    isLiking,
    isDisliking,
    isRating,
    error,
    
    // Actions
    handleLike,
    handleDislike,
    handleRate,
    clearError
  } = useGameActions();

  return (
    <div>
      <button 
        onClick={() => handleLike(gameId)}
        disabled={isLiking}
      >
        👍 لایک
      </button>
      
      <button 
        onClick={() => handleDislike(gameId)}
        disabled={isDisliking}
      >
        👎 دیسلایک
      </button>
      
      <button 
        onClick={() => handleRate(gameId, 5)}
        disabled={isRating}
      >
        ⭐ امتیاز 5
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### 3. useGameSearch

برای مدیریت جستجوی بازی‌ها با پیشنهادات

```tsx
import { useGameSearch } from '@/hooks/useGameSearch';

function SearchBox() {
  const {
    // State
    query,
    suggestions,
    isSearching,
    hasResults,
    
    // Actions
    setQuery,
    clearQuery,
    search
  } = useGameSearch();

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجو..."
      />
      
      {isSearching && <div>در حال جستجو...</div>}
      
      {hasResults && (
        <ul>
          {suggestions.map(suggestion => (
            <li 
              key={suggestion}
              onClick={() => search(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      
      <button onClick={clearQuery}>پاک کردن</button>
    </div>
  );
}
```

### 4. useGameFilters

برای مدیریت فیلترهای پیشرفته

```tsx
import { useGameFilters } from '@/hooks/useGameFilters';

function FilterPanel() {
  const {
    // State
    category,
    source,
    sortBy,
    showFeatured,
    priceRange,
    rating,
    tags,
    
    // Actions
    setCategory,
    setSource,
    setSortBy,
    setShowFeatured,
    setPriceRange,
    setRating,
    addTag,
    removeTag,
    clearFilters,
    getActiveFilters
  } = useGameFilters();

  return (
    <div>
      <select 
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">همه دسته‌ها</option>
        <option value="action">اکشن</option>
        <option value="puzzle">پازل</option>
      </select>
      
      <button onClick={clearFilters}>پاک کردن همه فیلترها</button>
      
      <div>
        فیلترهای فعال: {JSON.stringify(getActiveFilters())}
      </div>
    </div>
  );
}
```

### 5. useLoadingStates

برای مدیریت وضعیت‌های loading

```tsx
import { useLoadingStates } from '@/hooks/useLoadingStates';

function MyComponent() {
  const {
    // State
    isLoading,
    loadingMessage,
    progress,
    
    // Actions
    setLoading,
    setProgress,
    clearLoading
  } = useLoadingStates();

  const handleLoad = async () => {
    setLoading(true, 'در حال بارگذاری بازی‌ها...');
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    clearLoading();
  };

  return (
    <div>
      {isLoading && (
        <div>
          <p>{loadingMessage}</p>
          <progress value={progress} max={100} />
        </div>
      )}
      
      <button onClick={handleLoad}>بارگذاری</button>
    </div>
  );
}
```

### 6. useErrorStates

برای مدیریت خطاها

```tsx
import { useErrorStates } from '@/hooks/useErrorStates';

function MyComponent() {
  const {
    // State
    error,
    hasError,
    errorType,
    
    // Actions
    setError,
    clearError,
    handleError
  } = useErrorStates();

  const handleAction = async () => {
    try {
      // Your action here
      throw new Error('Network error');
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      {hasError && (
        <div className={`error error-${errorType}`}>
          <p>{error}</p>
          <button onClick={clearError}>بستن</button>
        </div>
      )}
      
      <button onClick={handleAction}>انجام عملیات</button>
    </div>
  );
}
```

## نکات مهم

1. **State مدیریت شده**: همه Hook ها state خودشان را مدیریت می‌کنند
2. **ساده و کاربردی**: هر Hook یک وظیفه خاص دارد
3. **قابل استفاده مجدد**: می‌توانید در چندین component استفاده کنید
4. **Type-Safe**: همه با TypeScript نوشته شده‌اند

## مثال کامل

```tsx
import { useGameHubSimple } from '@/hooks/useGameHubSimple';
import { useGameActions } from '@/hooks/useGameActions';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { useErrorStates } from '@/hooks/useErrorStates';

function CompleteGameHub() {
  // State management
  const gameHub = useGameHubSimple();
  const gameActions = useGameActions();
  const loading = useLoadingStates();
  const errors = useErrorStates();

  const handleGameLike = async (gameId: string) => {
    try {
      loading.setLoading(true, 'در حال ثبت لایک...');
      await gameActions.handleLike(gameId);
    } catch (err) {
      errors.handleError(err);
    } finally {
      loading.clearLoading();
    }
  };

  return (
    <div>
      {/* Your component UI */}
    </div>
  );
}
```

