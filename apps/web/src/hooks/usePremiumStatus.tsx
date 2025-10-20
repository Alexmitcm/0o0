import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { hono } from "@/helpers/fetcher";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";

export type UserStatus = "Standard" | "OnChainUnlinked" | "ProLinked";

interface PremiumStatusResponse {
  userStatus: UserStatus;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: string;
  } | null;
}

export const usePremiumStatus = () => {
  const { currentAccount } = useAccountStore();
  const { setUserStatus, setIsPremium, setLinkedProfile } = usePremiumStore();

  const query = useQuery({
    enabled: !!currentAccount?.address,
    gcTime: 300000, // 5 minutes
    queryFn: async (): Promise<PremiumStatusResponse> => {
      if (!currentAccount?.address) {
        throw new Error("No wallet connected");
      }

      const response = await hono.premium.getUserStatus(currentAccount.address);
      return response as unknown as PremiumStatusResponse;
    },
    queryKey: ["premium-status", currentAccount?.address],
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error.message?.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30000, // 30 seconds
    throwOnError: false // Prevent React Query from logging errors to console
  });

  // Handle success and error cases with useEffect
  useEffect(() => {
    if (query.data) {
      // Update global Zustand store on success
      setUserStatus(query.data.userStatus);
      setIsPremium(query.data.userStatus === "ProLinked");
      if (query.data.linkedProfile) {
        setLinkedProfile({
          ...query.data.linkedProfile,
          linkedAt: query.data.linkedProfile.linkedAt
        });
      } else {
        setLinkedProfile(null);
      }
    }
  }, [query.data, setUserStatus, setIsPremium, setLinkedProfile]);

  useEffect(() => {
    if (query.error) {
      const error = query.error as any;
      // Completely silent for 401 errors - this is expected when not authenticated
      if (error.message?.includes("401")) {
        // Reset to standard status silently
        setUserStatus("Standard");
        setIsPremium(false);
        setLinkedProfile(null);
        return;
      }
      // Only log non-401 errors that might indicate real issues
      console.error("Premium status fetch error:", error);
      // Reset to standard status on other errors
      setUserStatus("Standard");
      setIsPremium(false);
      setLinkedProfile(null);
    }
  }, [query.error, setUserStatus, setIsPremium, setLinkedProfile]);

  return query;
};
