interface Preferences {
  includeLowScore?: boolean;
  appIcon?: number;
}

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { hono } from "@/helpers/fetcher";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { usePreferencesStore } from "@/store/persisted/usePreferencesStore";

interface PreferencesProviderProps {
  children: ReactNode;
}

const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const { currentAccount } = useAccountStore();
  const { setAppIcon, setIncludeLowScore } = usePreferencesStore();
  const { accessToken } = hydrateAuthTokens();

  const { data: preferences, error } = useQuery<Preferences>({
    enabled: Boolean(currentAccount?.address && accessToken),
    queryFn: () => hono.preferences.get(),
    queryKey: ["preferences", currentAccount?.address],
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) {
        return false; // Don't retry 401 errors
      }
      return failureCount < 3; // Retry other errors up to 3 times
    },
    throwOnError: false // Prevent React Query from logging errors to console
  });

  // Handle errors silently for 401, log others
  useEffect(() => {
    if (error) {
      // Completely silent for 401 errors - this is expected when not authenticated
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      // Only log non-401 errors that might indicate real issues
      console.error("Preferences fetch error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (preferences) {
      setIncludeLowScore(preferences.includeLowScore ?? false);
      setAppIcon(preferences.appIcon ?? 0);
    }
  }, [preferences, setIncludeLowScore, setAppIcon]);

  return <>{children}</>;
};

export default PreferencesProvider;
