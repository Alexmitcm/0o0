import { HEY_API_URL } from "@hey/data/constants";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";

interface PremiumStatus {
  userStatus: "Standard" | "ProLinked";
  linkedProfile?: {
    profileId: string;
    linkedAt: string;
  };
  message?: string;
  canLink?: boolean;
}

export const useSimplePremium = () => {
  const account = useAccount();
  const { setUserStatus, setLinkedProfile } = usePremiumStore();
  const { currentAccount } = useAccountStore();

  const connectedWalletAddress = account?.address;
  const currentProfileId = currentAccount?.address as string | undefined;

  const {
    data: premiumStatus,
    isLoading,
    error
  } = useQuery<PremiumStatus>({
    enabled: Boolean(connectedWalletAddress && currentProfileId),
    queryFn: async () => {
      if (!connectedWalletAddress || !currentProfileId) {
        throw new Error("Missing wallet or profileId");
      }

      const res = await fetch(`${HEY_API_URL}/premium/v2/determine-status`, {
        body: JSON.stringify({
          profileId: currentProfileId,
          walletAddress: connectedWalletAddress
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!res.ok) throw new Error("Failed to get premium status");
      const json = await res.json();

      const data = json.data as {
        userStatus: "Standard" | "Premium";
        linkedProfileId?: string;
        canLink: boolean;
        message?: string;
      };

      const adapted: PremiumStatus =
        data.userStatus === "Premium"
          ? {
              linkedProfile: data.linkedProfileId
                ? {
                    linkedAt: new Date().toISOString(),
                    profileId: data.linkedProfileId
                  }
                : undefined,
              userStatus: "ProLinked"
            }
          : {
              canLink: data.canLink,
              linkedProfile: data.linkedProfileId
                ? {
                    linkedAt: new Date().toISOString(),
                    profileId: data.linkedProfileId
                  }
                : undefined,
              message: data.message,
              userStatus: "Standard"
            };

      return adapted;
    },
    queryKey: [
      "simple-premium-status",
      connectedWalletAddress,
      currentProfileId
    ],
    retry: 2,
    staleTime: 5 * 60 * 1000
  });

  // Reset state immediately when switching profiles to avoid stale premium state
  useEffect(() => {
    setUserStatus("Standard");
    setLinkedProfile(null);
  }, [currentProfileId, setUserStatus, setLinkedProfile]);

  useEffect(() => {
    if (!connectedWalletAddress || isLoading) {
      return;
    }

    if (error) {
      setUserStatus("Standard");
      setLinkedProfile(null);
      return;
    }

    if (!premiumStatus) {
      return;
    }

    setUserStatus(
      premiumStatus.userStatus === "ProLinked" ? "ProLinked" : "Standard"
    );

    if (premiumStatus.linkedProfile) {
      setLinkedProfile({
        handle: "",
        linkedAt: premiumStatus.linkedProfile.linkedAt,
        profileId: premiumStatus.linkedProfile.profileId
      });
    } else {
      setLinkedProfile(null);
    }
  }, [
    connectedWalletAddress,
    premiumStatus,
    isLoading,
    error,
    setUserStatus,
    setLinkedProfile
  ]);

  return {
    error,
    isConnected: Boolean(connectedWalletAddress),
    isLoading,
    isPremium: premiumStatus?.userStatus === "ProLinked",
    linkedProfile: premiumStatus?.linkedProfile,
    premiumStatus
  };
};
