import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useDualWalletContext } from "./DualWalletProvider";

interface WalletConnectionFlowProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const WalletConnectionFlow = ({
  onSuccess,
  onError
}: WalletConnectionFlowProps) => {
  const { address: metaMaskAddress, isConnected: isMetaMaskConnected } =
    useAccount();
  const { currentAccount } = useAccountStore();
  const {
    metaMaskWallet,
    familyWallet,
    lensProfiles,
    selectedProfile,
    isLinked,
    isPremium,
    isLoading,
    error,
    checkPremiumStatus,
    getLensProfiles,
    linkWallets,
    clearError
  } = useDualWalletContext();

  const [isLinking, setIsLinking] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const familyWalletAddress = currentAccount?.address;
  const isFamilyWalletConnected = !!familyWalletAddress;

  // Step 1: Check MetaMask connection
  const handleMetaMaskCheck = async () => {
    if (!metaMaskAddress) return;

    try {
      await checkPremiumStatus(metaMaskAddress);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Failed to check MetaMask status"
      );
    }
  };

  // Step 2: Get Lens profiles
  const handleGetProfiles = async () => {
    if (!familyWalletAddress) return;

    try {
      await getLensProfiles(familyWalletAddress);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to get Lens profiles"
      );
    }
  };

  // Step 3: Link wallets
  const handleLinkWallets = async () => {
    if (!metaMaskAddress || !familyWalletAddress || !selectedProfileId) return;

    setIsLinking(true);
    try {
      await linkWallets(
        metaMaskAddress,
        familyWalletAddress,
        selectedProfileId
      );
      onSuccess?.();
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to link wallets"
      );
    } finally {
      setIsLinking(false);
    }
  };

  // Auto-trigger checks when wallets are connected
  useEffect(() => {
    if (metaMaskAddress && !metaMaskWallet) {
      handleMetaMaskCheck();
    }
  }, [metaMaskAddress]);

  useEffect(() => {
    if (familyWalletAddress && !familyWallet) {
      handleGetProfiles();
    }
  }, [familyWalletAddress]);

  if (isLinked) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h3 className="mb-2 font-semibold text-green-800 text-lg">
          Wallets Linked Successfully!
        </h3>
        <p className="text-green-600">
          MetaMask: {metaMaskWallet?.slice(0, 6)}...{metaMaskWallet?.slice(-4)}
        </p>
        <p className="text-green-600">
          Family Wallet: {familyWallet?.slice(0, 6)}...{familyWallet?.slice(-4)}
        </p>
        {selectedProfile && (
          <p className="text-green-600">Lens Profile: {selectedProfile.id}</p>
        )}
        {isPremium && (
          <div className="mt-2 inline-flex items-center rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-800 text-sm">
            🎉 Premium User
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex">
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
              <div className="mt-2 text-red-700 text-sm">{error}</div>
              <div className="mt-2">
                <Button onClick={clearError} size="sm" variant="outline">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: MetaMask Connection */}
      <div className="rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 text-lg">
              Step 1: MetaMask Wallet
            </h3>
            <p className="text-gray-500 text-sm">
              Connect your MetaMask wallet to check premium status
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isMetaMaskConnected ? (
              <div className="flex items-center text-green-600">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                Connected
              </div>
            ) : (
              <div className="text-gray-400">Not Connected</div>
            )}
          </div>
        </div>

        {metaMaskWallet && (
          <div className="mt-4 rounded bg-gray-50 p-3">
            <p className="text-gray-600 text-sm">
              <strong>Address:</strong> {metaMaskWallet}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Premium Status:</strong>{" "}
              {isPremium ? "✅ Premium" : "❌ Not Premium"}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Family Wallet Connection */}
      <div className="rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 text-lg">
              Step 2: Family Wallet
            </h3>
            <p className="text-gray-500 text-sm">
              Connect your Family Wallet for Lens profile access
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isFamilyWalletConnected ? (
              <div className="flex items-center text-green-600">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                Connected
              </div>
            ) : (
              <div className="text-gray-400">Not Connected</div>
            )}
          </div>
        </div>

        {familyWallet && (
          <div className="mt-4 rounded bg-gray-50 p-3">
            <p className="text-gray-600 text-sm">
              <strong>Address:</strong> {familyWallet}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Lens Profiles:</strong> {lensProfiles.length} found
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Profile Selection */}
      {lensProfiles.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">
            Step 3: Select Lens Profile
          </h3>

          <div className="space-y-3">
            {lensProfiles.map((profile) => (
              <label
                className={`flex cursor-pointer items-center rounded-lg border p-4 ${
                  selectedProfileId === profile.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                key={profile.id}
              >
                <input
                  checked={selectedProfileId === profile.id}
                  className="h-4 w-4 text-purple-600"
                  name="profile"
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  type="radio"
                  value={profile.id}
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900 text-sm">
                    {profile.handle || profile.id}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {profile.isDefault ? "Default Profile" : "Profile"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Link Wallets */}
      {metaMaskWallet && familyWallet && selectedProfileId && (
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">
            Step 4: Link Wallets
          </h3>

          <Button
            className="w-full"
            disabled={isLoading || isLinking}
            onClick={handleLinkWallets}
          >
            {isLoading || isLinking ? "Linking..." : "Link Wallets"}
          </Button>
        </div>
      )}
    </div>
  );
};
