import { useState } from "react";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import {
  JoinProBanner,
  PremiumProvider,
  ProBadge,
  ProDashboard,
  ProfileSelectionModal
} from "./index";

const PremiumTestPage = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { currentAccount } = useAccountStore();

  return (
    <PremiumProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-bold text-4xl text-gray-900">
              Hey Pro Test Page
            </h1>
            <p className="text-gray-600">Testing all premium components</p>

            {/* Wallet Status */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-900">
                Wallet Status
              </h3>
              <p className="text-gray-600 text-sm">
                {currentAccount?.address
                  ? `Connected: ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                  : "Not connected"}
              </p>
            </div>
          </div>

          {/* Component Showcase */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Pro Badge Demo */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Pro Badge Component
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">Small:</span>
                  <ProBadge size="sm" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">Medium:</span>
                  <ProBadge size="md" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">Large:</span>
                  <ProBadge size="lg" />
                </div>
              </div>
              <p className="mt-4 text-gray-500 text-xs">
                The badge only shows when user is premium
              </p>
            </div>

            {/* Join Pro Banner Demo */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Join Pro Banner
              </h2>
              <JoinProBanner />
              <p className="mt-4 text-gray-500 text-xs">
                Shows for Standard users to encourage upgrade
              </p>
            </div>

            {/* Profile Selection Modal Demo */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Profile Selection Modal
              </h2>
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
                onClick={() => setShowProfileModal(true)}
                type="button"
              >
                Open Profile Selection Modal
              </button>
              <p className="mt-4 text-gray-500 text-xs">
                Opens modal for OnChainUnlinked users to select profile
              </p>
            </div>

            {/* Pro Dashboard Demo */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Pro Dashboard
              </h2>
              <div className="h-64 overflow-y-auto">
                <ProDashboard />
              </div>
              <p className="mt-4 text-gray-500 text-xs">
                Full dashboard for ProLinked users
              </p>
            </div>
          </div>

          {/* Status Information */}
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900 text-xl">
              Current Status
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900">Standard User</h3>
                <p className="text-blue-700 text-sm">
                  Not registered in referral program
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <h3 className="font-medium text-yellow-900">OnChainUnlinked</h3>
                <p className="text-sm text-yellow-700">
                  Registered but profile not linked
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <h3 className="font-medium text-green-900">ProLinked</h3>
                <p className="text-green-700 text-sm">
                  Fully set up premium user
                </p>
              </div>
            </div>
          </div>

          {/* Profile Selection Modal */}
          <ProfileSelectionModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onProfileSelect={async (_profileId: string) => {
              setShowProfileModal(false);
              console.log("Profile linked successfully!");
            }}
            profiles={[]}
          />
        </div>
      </div>
    </PremiumProvider>
  );
};

export default PremiumTestPage;
