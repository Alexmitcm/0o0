import { useState } from "react";
import { useUserStatus } from "@/hooks/usePremium";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import {
  JoinProBanner,
  ProBadge,
  ProDashboard,
  ProfileSelectionModal
} from "./index";

const PremiumPage = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { currentAccount } = useAccountStore();
  const { status, isLoading } = useUserStatus();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-purple-600 border-b-2" />
          <p className="text-gray-600">Loading premium status...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not connected
  if (!currentAccount?.address) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-purple-100 p-4">
            <svg
              className="h-8 w-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h2 className="mb-2 font-bold text-2xl text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to access premium features
          </p>
        </div>
      </div>
    );
  }

  // Render based on user status
  switch (status) {
    case "ProLinked":
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <ProBadge size="lg" />
              <h1 className="font-bold text-3xl text-gray-900">Hey Pro</h1>
            </div>
            <ProDashboard />
          </div>
        </div>
      );

    case "OnChainUnlinked":
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 p-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h1 className="mb-2 font-bold text-3xl text-gray-900">
                Wallet Registered!
              </h1>
              <p className="text-gray-600">
                Your wallet is registered in the referral program. Now link your
                Lens profile to complete the setup.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-center">
                <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                  Link Your Profile
                </h2>
                <p className="mb-6 text-gray-600">
                  Choose which Lens profile you want to permanently link to your
                  premium wallet. This action is irreversible.
                </p>
                <button
                  className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  onClick={() => setShowProfileModal(true)}
                  type="button"
                >
                  Select Profile
                </button>
              </div>
            </div>

            <ProfileSelectionModal
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
              onProfileSelect={async (_profileId: string) => {
                // Handle profile selection
                setShowProfileModal(false);
                // The PremiumProvider will automatically update the status
              }}
              profiles={[]}
            />
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <h1 className="mb-2 font-bold text-3xl text-gray-900">Hey Pro</h1>
              <p className="text-gray-600">
                Upgrade to unlock premium features and earn rewards
              </p>
            </div>

            <JoinProBanner />

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-lg">
                  Referral Rewards
                </h3>
                <p className="text-gray-600">
                  Earn USDT rewards through our referral program
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-lg">
                  Premium Badge
                </h3>
                <p className="text-gray-600">
                  Get a verified Pro badge on your profile
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-lg">
                  Early Access
                </h3>
                <p className="text-gray-600">
                  Be the first to try new features and updates
                </p>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default PremiumPage;
