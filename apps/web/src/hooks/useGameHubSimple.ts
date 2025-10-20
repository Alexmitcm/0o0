import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface GameHubSimpleState {
  selectedCategory: string;
  searchQuery: string;
  sortBy: "newest" | "popular" | "rating" | "plays";
  showFeatured: boolean;
  mobileMenuOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GameHubSimpleActions {
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: "newest" | "popular" | "rating" | "plays") => void;
  setShowFeatured: (featured: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  syncParams: (updates: Partial<Record<string, string>>) => void;
}

export const useGameHubSimple = (): GameHubSimpleState & GameHubSimpleActions => {
  const [params, setParams] = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.get("category") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    params.get("q") || ""
  );
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "plays">(
    (params.get("sort") as any) || "newest"
  );
  const [showFeatured, setShowFeatured] = useState<boolean>(
    params.get("featured") === "1"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync URL params with state
  useEffect(() => {
    const category = params.get("category") || "";
    const search = params.get("q") || "";
    const sort = (params.get("sort") as any) || "newest";
    const featured = params.get("featured") === "1";

    setSelectedCategory(category);
    setSearchQuery(search);
    setSortBy(sort);
    setShowFeatured(featured);
  }, [params]);

  const syncParams = useCallback((updates: Partial<Record<string, string>>) => {
    const nextParams = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    }
    setParams(nextParams, { replace: true });
  }, [params, setParams]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("");
    setSearchQuery("");
    setSortBy("newest");
    setShowFeatured(false);
    syncParams({
      category: "",
      q: "",
      sort: "",
      featured: ""
    });
  }, [syncParams]);

  return {
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
  };
};
