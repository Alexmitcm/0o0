import fetchApi from "./fetcher";

export interface Game {
  id: string;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  gameFileUrl: string;
  entryFilePath?: string;
  thumb1Url: string;
  thumb2Url: string;
  width: number;
  height: number;
  source: string;
  externalUrl?: string;
  status: string;
  isFeatured: boolean;
  gameType: "FreeToPlay" | "PlayToEarn";
  playCount: number;
  likeCount: number;
  dislikeCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  categories: GameCategory[];
  user?: {
    walletAddress: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  userLike?: boolean;
  userDislike?: boolean;
  userRating?: number | null;
  createdAt: string;
  updatedAt: string;
  // Additional properties for UI components
  gradient?: string;
  image?: string;
  isHot?: boolean;
  hasNFT?: boolean;
  category?: string;
  players?: string;
}

export interface GameCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  _count?: {
    games: number;
  };
}

export interface GamesResponse {
  games: Game[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CategoriesResponse {
  categories: GameCategory[];
}

export interface FetchGamesParams {
  category?: string;
  search?: string;
  source?: string;
  sortBy?: "newest" | "popular" | "rating" | "plays";
  featured?: boolean;
  page?: number;
  limit?: number;
}

// Session storage helpers for likes and ratings
const SESSION_LIKES_KEY = "gamehub_likes";
const SESSION_RATINGS_KEY = "gamehub_ratings";

export const getSessionLikes = (): Set<string> => {
  try {
    const likes = sessionStorage.getItem(SESSION_LIKES_KEY);
    if (!likes) return new Set();
    
    const parsed = JSON.parse(likes);
    // Validate that it's an array of strings
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return new Set(parsed);
    }
    
    // If invalid data, clear it and return empty set
    sessionStorage.removeItem(SESSION_LIKES_KEY);
    return new Set();
  } catch (error) {
    console.warn("Failed to parse session likes:", error);
    // Clear invalid data
    sessionStorage.removeItem(SESSION_LIKES_KEY);
    return new Set();
  }
};

export const setSessionLikes = (likes: Set<string>) => {
  try {
    sessionStorage.setItem(SESSION_LIKES_KEY, JSON.stringify([...likes]));
  } catch (error) {
    console.error("Failed to save likes to session storage:", error);
  }
};

export const getSessionRatings = (): Record<string, number> => {
  try {
    const ratings = sessionStorage.getItem(SESSION_RATINGS_KEY);
    if (!ratings) return {};
    
    const parsed = JSON.parse(ratings);
    // Validate that it's an object with string keys and number values
    if (typeof parsed === 'object' && parsed !== null && 
        Object.values(parsed).every(val => typeof val === 'number' && val >= 1 && val <= 5)) {
      return parsed;
    }
    
    // If invalid data, clear it and return empty object
    sessionStorage.removeItem(SESSION_RATINGS_KEY);
    return {};
  } catch (error) {
    console.warn("Failed to parse session ratings:", error);
    // Clear invalid data
    sessionStorage.removeItem(SESSION_RATINGS_KEY);
    return {};
  }
};

export const setSessionRatings = (ratings: Record<string, number>) => {
  try {
    sessionStorage.setItem(SESSION_RATINGS_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.error("Failed to save ratings to session storage:", error);
  }
};

export const addSessionLike = (gameId: string) => {
  const likes = getSessionLikes();
  likes.add(gameId);
  setSessionLikes(likes);
};

export const removeSessionLike = (gameId: string) => {
  const likes = getSessionLikes();
  likes.delete(gameId);
  setSessionLikes(likes);
};

export const setSessionRating = (gameId: string, rating: number) => {
  const ratings = getSessionRatings();
  ratings[gameId] = rating;
  setSessionRatings(ratings);
};

export const getSessionRating = (gameId: string): number | null => {
  const ratings = getSessionRatings();
  return ratings[gameId] || null;
};

export const isSessionLiked = (gameId: string): boolean => {
  const likes = getSessionLikes();
  return likes.has(gameId);
};

export const fetchGames = async (
  params: FetchGamesParams = {}
): Promise<GamesResponse> => {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.append("category", params.category);
  if (params.search) searchParams.append("search", params.search);
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.featured) searchParams.append("featured", "true");
  if (params.source) searchParams.append("source", params.source);
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const endpoint = `/games${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return fetchApi<GamesResponse>(endpoint);
};

export const fetchCategories = async (): Promise<CategoriesResponse> => {
  return fetchApi<CategoriesResponse>("/games/categories");
};

export const getGame = async (slug: string): Promise<Game> => {
  try {
    const response = await fetchApi<{ game: Game }>(`/games/${slug}`);
    return response.game;
  } catch (error) {
    console.error("Error fetching game:", error);
    throw error;
  }
};

export const reportGame = async (
  slug: string,
  data: { reason: "Bug" | "Error" | "Other"; description?: string }
): Promise<{ success: boolean; report: any }> => {
  try {
    const response = await fetchApi<{ success: boolean; report: any }>(
      `/games/${slug}/report`,
      {
        body: JSON.stringify(data),
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error reporting game:", error);
    throw error;
  }
};

export const shareToSocialMedia = (
  platform: string,
  gameTitle: string,
  gameUrl: string
) => {
  const text = `Check out this awesome game: ${gameTitle}`;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(gameUrl);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(gameTitle)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
  };

  const url = shareUrls[platform as keyof typeof shareUrls];
  if (url) {
    window.open(url, "_blank", "width=600,height=400");
  }
};

export const fetchSimilarGames = async (
  slug: string
): Promise<{ games: Game[] }> => {
  try {
    const response = await fetchApi<{ games: Game[] }>(
      `/games/${slug}/similar`
    );
    return response;
  } catch (error) {
    console.error("Error fetching similar games:", error);
    throw error;
  }
};

export const playGame = async (
  slug: string,
  data: {
    playDuration?: number;
    score?: number;
    completed?: boolean;
  }
): Promise<{ success: boolean; gamePlay: any }> => {
  try {
    const response = await fetchApi<{ success: boolean; gamePlay: any }>(
      `/games/${slug}/play`,
      {
        body: JSON.stringify(data),
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error recording game play:", error);
    throw error;
  }
};

export const fetchLikedGames = async (): Promise<GamesResponse> => {
  // For now, return liked games from session storage
  // TODO: Replace with actual backend call when persistent storage is implemented
  const sessionLikes = getSessionLikes();

  if (sessionLikes.size === 0) {
    return {
      games: [],
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10,
        page: 1,
        total: 0,
        totalPages: 0
      }
    };
  }

  // Get all games and filter by session likes
  try {
    const allGames = await fetchGames({ limit: 100 });
    const likedGames = allGames.games.filter((game) =>
      sessionLikes.has(game.id)
    );
    return {
      games: likedGames,
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        limit: likedGames.length,
        page: 1,
        total: likedGames.length,
        totalPages: 1
      }
    };
  } catch (error) {
    console.error("Failed to fetch liked games:", error);
    return {
      games: [],
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10,
        page: 1,
        total: 0,
        totalPages: 0
      }
    };
  }
};

export const likeGame = async (
  gameSlug: string
): Promise<{ success: boolean; liked: boolean }> => {
  try {
    const response = await fetchApi<{ success: boolean; liked: boolean }>(
      `/games/${gameSlug}/like`,
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error liking game:", error);
    throw error;
  }
};

export const unlikeGame = async (
  gameSlug: string
): Promise<{ success: boolean; liked: boolean }> => {
  try {
    const response = await fetchApi<{ success: boolean; liked: boolean }>(
      `/games/${gameSlug}/unlike`,
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error unliking game:", error);
    throw error;
  }
};

export const rateGame = async (
  gameSlug: string,
  rating: number
): Promise<{ success: boolean; rating: number }> => {
  try {
    const response = await fetchApi<{ success: boolean; rating: number }>(
      `/games/${gameSlug}/rate`,
      {
        body: JSON.stringify({ rating }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error rating game:", error);
    throw error;
  }
};

export const dislikeGame = async (
  gameSlug: string
): Promise<{ success: boolean; disliked: boolean }> => {
  try {
    const response = await fetchApi<{ success: boolean; disliked: boolean }>(
      `/games/${gameSlug}/dislike`,
      {
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    return response;
  } catch (error) {
    console.error("Error disliking game:", error);
    throw error;
  }
};
