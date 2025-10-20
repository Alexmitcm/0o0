import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { hono } from "@/helpers/fetcher";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";

interface AvailableProfilesResponse {
  profiles: Array<{
    id: string;
    handle: string;
    ownedBy: string;
    isDefault: boolean;
  }>;
  canLink: boolean;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: string;
  } | null;
}

interface ProfileLinkParams {
  profileId: string;
}

export const useProfileSelection = () => {
  const { currentAccount } = useAccountStore();
  const { setUserStatus, setIsPremium } = usePremiumStore();
  const queryClient = useQueryClient();

  // Query to fetch available profiles with business logic enforcement
  const profilesQuery = useQuery({
    enabled: !!currentAccount?.address,
    queryFn: async (): Promise<AvailableProfilesResponse> => {
      if (!currentAccount?.address) {
        throw new Error("No wallet connected");
      }

      const response = await hono.premium.getAvailableProfiles(
        currentAccount.address
      );
      return response as unknown as AvailableProfilesResponse;
    },
    queryKey: ["available-profiles", currentAccount?.address],
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error.message?.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 60000, // 1 minute
    throwOnError: false // Prevent React Query from logging errors to console
  });

  // Handle errors with useEffect
  useEffect(() => {
    if (profilesQuery.error) {
      const error = profilesQuery.error as any;
      // Completely silent for 401 errors - this is expected when not authenticated
      if (error.message?.includes("401")) {
        return;
      }
      // Only log non-401 errors that might indicate real issues
      console.error("Available profiles fetch error:", error);
    }
  }, [profilesQuery.error]);

  // Mutation to link profile
  const linkProfileMutation = useMutation({
    mutationFn: async ({ profileId }: ProfileLinkParams) => {
      if (!currentAccount?.address) {
        throw new Error("No wallet connected");
      }

      const response = await hono.premium.linkProfile(
        currentAccount.address,
        profileId
      );

      return response;
    }
  });

  // Handle link profile success and error
  useEffect(() => {
    if (linkProfileMutation.error) {
      const error = linkProfileMutation.error as Error;
      toast.error(`Failed to link profile: ${error.message}`);
      console.error("Profile linking error:", error);
    }
  }, [linkProfileMutation.error]);

  useEffect(() => {
    if (linkProfileMutation.data) {
      toast.success("Profile linked successfully! Welcome to Hey Pro!");

      // Update user status to ProLinked
      setUserStatus("ProLinked");
      setIsPremium(true);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["premium-status"] });
      queryClient.invalidateQueries({ queryKey: ["available-profiles"] });

      console.log("Profile linked successfully:", linkProfileMutation.data);
    }
  }, [linkProfileMutation.data, setUserStatus, setIsPremium, queryClient]);

  // Mutation to auto-link first profile
  const autoLinkProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentAccount?.address) {
        throw new Error("No wallet connected");
      }

      const response = await hono.premium.autoLinkProfile(
        currentAccount.address
      );
      return response;
    }
  });

  // Handle auto-link profile success and error
  useEffect(() => {
    if (autoLinkProfileMutation.error) {
      const error = autoLinkProfileMutation.error as Error;
      toast.error(`Failed to auto-link profile: ${error.message}`);
      console.error("Profile auto-linking error:", error);
    }
  }, [autoLinkProfileMutation.error]);

  useEffect(() => {
    if (autoLinkProfileMutation.data) {
      toast.success("Profile auto-linked successfully! Welcome to Hey Pro!");

      // Update user status to ProLinked
      setUserStatus("ProLinked");
      setIsPremium(true);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["premium-status"] });
      queryClient.invalidateQueries({ queryKey: ["available-profiles"] });

      console.log(
        "Profile auto-linked successfully:",
        autoLinkProfileMutation.data
      );
    }
  }, [autoLinkProfileMutation.data, setUserStatus, setIsPremium, queryClient]);

  return {
    autoLinkError: autoLinkProfileMutation.error,
    autoLinkProfile: autoLinkProfileMutation.mutate,
    canLink: profilesQuery.data?.canLink || false,
    isAutoLinking: autoLinkProfileMutation.isPending,
    isLinkingProfile: linkProfileMutation.isPending,
    isLoadingProfiles: profilesQuery.isLoading,

    // Profile linking
    linkError: linkProfileMutation.error,
    linkedProfile: profilesQuery.data?.linkedProfile || null,
    linkProfile: linkProfileMutation.mutate,

    // Profile fetching with business logic
    profiles: profilesQuery.data?.profiles || [],
    profilesError: profilesQuery.error,
    refetchProfiles: profilesQuery.refetch
  };
};
