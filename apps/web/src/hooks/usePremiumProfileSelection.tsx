import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface Profile {
  id: string;
  handle: string;
  ownedBy: string;
  isDefault: boolean;
}

interface PremiumStatus {
  userStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  } | null;
}

interface AvailableProfiles {
  profiles: Profile[];
  canLink: boolean;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  } | null;
}

export function usePremiumProfileSelection() {
  const { address } = useAccount();
  const { currentAccount } = useAccountStore();
  const currentProfileId = currentAccount?.address as string | undefined;
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(
    null
  );
  const [availableProfiles, setAvailableProfiles] =
    useState<AvailableProfiles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch premium status for the connected wallet (POST - no auth required)
  const fetchPremiumStatus = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the correct endpoint with query parameter
      const response = await fetch(
        `${HEY_API_URL}/premium/v2/determine-status`,
        {
          body: JSON.stringify({ profileId: currentProfileId, walletAddress }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch premium status");
      }

      const data = await response.json();
      setPremiumStatus(data.data);
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch premium status for the connected wallet (GET with auth)
  const fetchPremiumStatusWithAuth = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get token from localStorage or your auth context
      const token =
        localStorage.getItem("jwt") || sessionStorage.getItem("jwt");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${HEY_API_URL}/premium/v2/determine-status`,
        {
          body: JSON.stringify({ profileId: currentProfileId, walletAddress }),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch premium status");
      }

      const data = await response.json();
      setPremiumStatus(data.data); // Note: GET endpoint returns { data: result }
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available profiles for linking
  const fetchAvailableProfiles = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${HEY_API_URL}/premium/v2/available-profiles`,
        {
          body: JSON.stringify({ walletAddress }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available profiles");
      }

      const data = await response.json();
      setAvailableProfiles(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-link first profile (Case 1 & 2)
  const autoLinkFirstProfile = async (walletAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${HEY_API_URL}/premium/v2/auto-link`, {
        body: JSON.stringify({ walletAddress }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to auto-link profile");
      }

      const data = await response.json();

      // Update local state
      setPremiumStatus({
        linkedProfile: data,
        userStatus: "ProLinked"
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Manual profile linking - can be called with just profileId (uses current wallet) or both parameters
  const linkProfile = async (
    walletAddressOrProfileId: string,
    profileId?: string
  ) => {
    // Handle overloaded function signature
    const finalWalletAddress = profileId ? walletAddressOrProfileId : address;
    const finalProfileId = profileId ? profileId : walletAddressOrProfileId;

    if (!finalWalletAddress || !finalProfileId) {
      throw new Error("Missing wallet address or profile ID");
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${HEY_API_URL}/premium/v2/link`, {
        body: JSON.stringify({
          profileId: finalProfileId,
          walletAddress: finalWalletAddress
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData?.error === "AlreadyLinked") {
          const msg = `This premium wallet (${finalWalletAddress}) is already linked to profile ${errorData.linkedProfileId}. Linking is permanent.`;
          throw new Error(msg);
        }
        throw new Error(errorData.message || "Failed to link profile");
      }

      const data = await response.json();

      // Update local state
      setPremiumStatus({
        linkedProfile: data,
        userStatus: "ProLinked"
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize premium status when wallet connects
  useEffect(() => {
    if (address) {
      fetchPremiumStatus(address); // Use GET method with query parameter
    } else {
      setPremiumStatus(null);
      setAvailableProfiles(null);
    }
  }, [address, currentProfileId]);

  // Determine which case we're dealing with
  const getCurrentCase = () => {
    if (!address || !premiumStatus) return null;

    switch (premiumStatus.userStatus) {
      case "Standard":
        return "not-registered";
      case "OnChainUnlinked":
        return "registered-no-profile";
      case "ProLinked":
        return "already-linked";
      default:
        return null;
    }
  };

  // Check if we should show the profile selection modal (Case 3)
  const shouldShowProfileModal = async () => {
    if (!address || premiumStatus?.userStatus !== "OnChainUnlinked") {
      return false;
    }

    try {
      const profiles = await fetchAvailableProfiles(address);
      return profiles.canLink && profiles.profiles.length > 1;
    } catch {
      return false;
    }
  };

  return {
    autoLinkFirstProfile,
    availableProfiles,
    canLink: availableProfiles?.canLink ?? false,
    error,
    fetchAvailableProfiles,

    // Actions
    fetchPremiumStatus,
    fetchPremiumStatusWithAuth, // Alternative method with authentication

    // Helpers
    getCurrentCase,
    hasMultipleProfiles: (availableProfiles?.profiles.length ?? 0) > 1,
    isLinked: premiumStatus?.userStatus === "ProLinked",
    isLoading,

    // Computed values
    isRegistered: premiumStatus?.userStatus !== "Standard",
    linkProfile,
    // State
    premiumStatus,
    shouldShowProfileModal
  };
}
