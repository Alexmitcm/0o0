import { useCallback, useMemo, useState } from "react";

export interface GameFiltersState {
  category: string;
  source: string;
  sortBy: "newest" | "popular" | "rating" | "plays";
  showFeatured: boolean;
  priceRange: [number, number];
  rating: number;
  tags: string[];
}

export interface GameFiltersActions {
  setCategory: (category: string) => void;
  setSource: (source: string) => void;
  setSortBy: (sort: "newest" | "popular" | "rating" | "plays") => void;
  setShowFeatured: (featured: boolean) => void;
  setPriceRange: (range: [number, number]) => void;
  setRating: (rating: number) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  clearFilters: () => void;
  getActiveFilters: () => Record<string, any>;
}

export const useGameFilters = (): GameFiltersState & GameFiltersActions => {
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "plays">("newest");
  const [showFeatured, setShowFeatured] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  const addTag = useCallback((tag: string) => {
    setTags(prev => [...prev, tag]);
  }, []);

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const clearFilters = useCallback(() => {
    setCategory("");
    setSource("");
    setSortBy("newest");
    setShowFeatured(false);
    setPriceRange([0, 100]);
    setRating(0);
    setTags([]);
  }, []);

  const getActiveFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    
    if (category) filters.category = category;
    if (source) filters.source = source;
    if (sortBy !== "newest") filters.sortBy = sortBy;
    if (showFeatured) filters.featured = true;
    if (priceRange[0] > 0 || priceRange[1] < 100) filters.priceRange = priceRange;
    if (rating > 0) filters.rating = rating;
    if (tags.length > 0) filters.tags = tags;
    
    return filters;
  }, [category, source, sortBy, showFeatured, priceRange, rating, tags]);

  return {
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
  };
};