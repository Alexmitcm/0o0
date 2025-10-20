import { HEY_API_URL } from "@hey/data/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileSelectionModal from "@/components/Premium/ProfileSelectionModal";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";

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
    linkedAt?: string | Date;
  } | null;
}

interface AvailableProfiles {
  profiles: Profile[];
  canLink: boolean;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt?: string | Date;
  } | null;
}

export const useInitPremium = () => {
  const { currentAccount } = useAccountStore();
  const { setUserStatus, setLinkedProfile, setError } = usePremiumStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const queryClient = useQueryClient();
  const currentProfileId = currentAccount?.address as string | undefined;

  // Query to get premium status
  const { data: premiumStatus, isLoading: statusLoading } =
    useQuery<PremiumStatus>({
      enabled: Boolean(currentAccount?.address),
      queryFn: async () => {
        const res = await fetch(`${HEY_API_URL}/premium/v2/determine-status`, {
          body: JSON.stringify({
            profileId: currentProfileId,
            walletAddress: currentAccount?.address
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });
        if (!res.ok) throw new Error("Failed to get premium status");
        const json = await res.json();
        // Adapt v2 response to legacy shape
        const data = json.data as {
          userStatus: "Standard" | "Premium";
          linkedProfileId?: string;
          canLink: boolean;
        };
        const adapted: PremiumStatus =
          data.userStatus === "Premium"
            ? {
                linkedProfile: data.linkedProfileId
                  ? {
                      handle: "",
                      linkedAt: new Date().toISOString(),
                      profileId: data.linkedProfileId
                    }
                  : null,
                userStatus: "ProLinked"
              }
            : { userStatus: data.canLink ? "OnChainUnlinked" : "Standard" };
        return adapted;
      },
      queryKey: ["premium-status", currentAccount?.address, currentProfileId],
      retry: 2
    });

  // Query to get available profiles for linking
  const { data: profilesData, isLoading: profilesLoading } =
    useQuery<AvailableProfiles>({
      enabled: Boolean(
        currentAccount?.address &&
          premiumStatus?.userStatus === "OnChainUnlinked"
      ),
      queryFn: async () => {
        const res = await fetch(
          `${HEY_API_URL}/premium/v2/available-profiles`,
          {
            body: JSON.stringify({ walletAddress: currentAccount?.address }),
            headers: { "Content-Type": "application/json" },
            method: "POST"
          }
        );
        if (!res.ok) throw new Error("Failed to get available profiles");
        const json = await res.json();
        return json.data as AvailableProfiles;
      },
      queryKey: ["available-profiles", currentAccount?.address],
      retry: 2
    });

  // Mutation to auto-link first profile
  const autoLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${HEY_API_URL}/premium/v2/auto-link`, {
        body: JSON.stringify({ walletAddress: currentAccount?.address }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to auto-link profile");
      const json = await res.json();
      return json.data as {
        profileId: string;
        handle?: string;
        linkedAt?: string;
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to auto-link profile");
      setError(error.message);
    },
    onSuccess: (data) => {
      toast.success("Profile auto-linked successfully!");
      setUserStatus("ProLinked");
      setLinkedProfile({
        handle: data.handle || "",
        linkedAt: data.linkedAt || new Date().toISOString(),
        profileId: data.profileId
      });
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["premium-status"] });
    }
  });

  // Mutation to manually link a profile
  const linkProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await fetch(`${HEY_API_URL}/premium/v2/link`, {
        body: JSON.stringify({
          profileId,
          walletAddress: currentAccount?.address
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to link profile");
      const json = await res.json();
      return json.data as {
        profileId: string;
        handle?: string;
        linkedAt?: string;
      };
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to link profile");
      setError(error.message);
    },
    onSuccess: (data) => {
      toast.success("Profile linked successfully!");
      setUserStatus("ProLinked");
      setLinkedProfile({
        handle: data.handle || "",
        linkedAt: data.linkedAt || new Date().toISOString(),
        profileId: data.profileId
      });
      setError(null);
      setShowProfileModal(false);
      queryClient.invalidateQueries({ queryKey: ["premium-status"] });
    }
  });

  // Handle profile selection from modal
  const handleProfileSelect = async (profileId: string) => {
    await linkProfileMutation.mutateAsync(profileId);
  };

  // Initialize premium status and handle automatic linking
  useEffect(() => {
    if (!currentAccount?.address || statusLoading) {
      return;
    }

    if (!premiumStatus) {
      return;
    }

    // Update global state based on premium status
    setUserStatus(premiumStatus.userStatus);

    if (premiumStatus.linkedProfile) {
      setLinkedProfile(premiumStatus.linkedProfile);
    } else {
      setLinkedProfile(null);
    }

    // Handle automatic linking logic
    if (premiumStatus.userStatus === "OnChainUnlinked") {
      // Check if we have profile data
      if (profilesData && !profilesLoading) {
        if (profilesData.profiles.length === 1) {
          // Auto-link the single profile
          autoLinkMutation.mutate();
        } else if (profilesData.profiles.length > 1) {
          // Show modal for multiple profiles
          setAvailableProfiles(profilesData.profiles);
          setShowProfileModal(true);
        }
      }
    }

    setError(null);
  }, [
    currentAccount?.address,
    premiumStatus,
    profilesData,
    statusLoading,
    profilesLoading,
    setUserStatus,
    setLinkedProfile,
    setError,
    autoLinkMutation
  ]);

  return {
    availableProfiles,
    handleProfileSelect,
    isLoading:
      statusLoading ||
      profilesLoading ||
      autoLinkMutation.isPending ||
      linkProfileMutation.isPending,
    ProfileSelectionModal: () => (
      <ProfileSelectionModal
        isLoading={linkProfileMutation.isPending}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSelect={handleProfileSelect}
        profiles={availableProfiles}
      />
    ),
    premiumStatus,
    setShowProfileModal,
    showProfileModal
  };
};
