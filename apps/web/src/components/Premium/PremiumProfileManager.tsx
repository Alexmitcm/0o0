import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePremiumProfileSelection } from "@/hooks/usePremiumProfileSelection";
import ProfileSelectionModal from "./ProfileSelectionModal";

export default function PremiumProfileManager() {
  const { address, isConnected } = useAccount();
  const {
    premiumStatus,
    availableProfiles,
    isLoading,
    error,
    autoLinkFirstProfile,
    linkProfile,
    fetchAvailableProfiles,
    getCurrentCase,
    isRegistered,
    isLinked,
    canLink,
    hasMultipleProfiles
  } = usePremiumProfileSelection();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [autoLinkAttempted, setAutoLinkAttempted] = useState(false);

  // Handle automatic profile linking for Cases 1 & 2
  useEffect(() => {
    if (!address || !isConnected || autoLinkAttempted) return;

    const handleAutoLink = async () => {
      const currentCase = getCurrentCase();

      if (currentCase === "registered-no-profile") {
        try {
          // Check if user has exactly one profile (Case 2)
          const profiles = await fetchAvailableProfiles(address);

          if (profiles.canLink && profiles.profiles.length === 1) {
            // Auto-link the single profile
            await autoLinkFirstProfile(address);
            console.log("✅ Auto-linked single profile");
          } else if (profiles.canLink && profiles.profiles.length > 1) {
            // Case 3: Multiple profiles - show selection modal
            setShowProfileModal(true);
          }
        } catch (error) {
          console.error("Failed to handle auto-linking:", error);
        }
      }

      setAutoLinkAttempted(true);
    };

    handleAutoLink();
  }, [
    address,
    isConnected,
    autoLinkAttempted,
    getCurrentCase,
    fetchAvailableProfiles,
    autoLinkFirstProfile
  ]);

  // Handle profile selection from modal (Case 3)
  const handleProfileSelect = async (profileId: string) => {
    if (!address) return;

    try {
      await linkProfile(address, profileId);
      setShowProfileModal(false);
      console.log("✅ Profile manually linked");
    } catch (error) {
      console.error("Failed to link profile:", error);
      throw error;
    }
  };

  // Don't render anything if wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  // Show loading state
  if (isLoading && !premiumStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2 text-gray-600 text-sm">
          Checking premium status...
        </span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-red-800 text-sm">Error</h3>
            <p className="mt-1 text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Case 1: Not registered in referral contract
  if (!isRegistered) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-800 text-sm">
              Standard Account
            </h3>
            <p className="mt-1 text-gray-600 text-sm">
              Your wallet is not registered in the referral program. Register to
              unlock premium features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Case 2 & 3: Registered but not linked
  if (isRegistered && !isLinked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="font-medium text-amber-800 text-sm">
              Premium Account - Profile Not Linked
            </h3>
            <p className="mt-1 text-amber-700 text-sm">
              Your wallet is registered as premium.{" "}
              {hasMultipleProfiles
                ? "Please select a profile to link permanently."
                : "Linking your profile automatically..."}
            </p>
            {hasMultipleProfiles && (
              <button
                className="mt-2 inline-flex items-center rounded border border-transparent bg-amber-100 px-3 py-1.5 font-medium text-amber-700 text-xs hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                onClick={() => setShowProfileModal(true)}
              >
                Select Profile
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Already linked
  if (isLinked && premiumStatus?.linkedProfile) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-green-800 text-sm">
              Premium Profile Linked
            </h3>
            <p className="mt-1 text-green-700 text-sm">
              Your premium profile:{" "}
              <strong>@{premiumStatus.linkedProfile.handle}</strong>
            </p>
            <p className="mt-1 text-green-600 text-xs">
              Linked on{" "}
              {new Date(
                premiumStatus.linkedProfile.linkedAt
              ).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Profile Selection Modal
  return (
    <ProfileSelectionModal
      isLoading={isLoading}
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      onProfileSelect={handleProfileSelect}
      profiles={availableProfiles?.profiles || []}
    />
  );
}
