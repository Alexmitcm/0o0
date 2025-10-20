import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";

export interface GameSearchState {
  query: string;
  suggestions: string[];
  isSearching: boolean;
  hasResults: boolean;
}

export interface GameSearchActions {
  setQuery: (query: string) => void;
  clearQuery: () => void;
  search: (query: string) => void;
}

export const useGameSearch = (): GameSearchState & GameSearchActions => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setIsResults] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Mock suggestions - in real app, this would come from API
  const mockSuggestions = [
    "action games",
    "puzzle games", 
    "racing games",
    "strategy games",
    "arcade games",
    "sports games",
    "adventure games",
    "shooting games"
  ];

  // Update suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    const timer = setTimeout(() => {
      const filtered = mockSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      
      setSuggestions(filtered);
      setIsResults(filtered.length > 0);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [debouncedQuery]);

  const setQueryValue = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setIsResults(false);
  }, []);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  return {
    // State
    query,
    suggestions,
    isSearching,
    hasResults,
    
    // Actions
    setQuery: setQueryValue,
    clearQuery,
    search
  };
};
