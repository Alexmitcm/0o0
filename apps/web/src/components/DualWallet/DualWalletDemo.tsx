import { useDualWalletContext } from "./DualWalletProvider";
import { WalletConnectionFlow } from "./WalletConnectionFlow";

export const DualWalletDemo = () => {
  const {
    metaMaskWallet,
    familyWallet,
    lensProfiles,
    selectedProfile,
    isLinked,
    isPremium,
    isLoading,
    error
  } = useDualWalletContext();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-4 font-bold text-3xl text-gray-900">
          🔐 Dual Wallet Authentication System
        </h1>
        <p className="text-gray-600 text-lg">
          Connect MetaMask for premium features and Family Wallet for Lens
          profiles
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* MetaMask Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">MetaMask</h3>
            <div
              className={`h-3 w-3 rounded-full ${metaMaskWallet ? "bg-green-500" : "bg-gray-300"}`}
            />
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            {metaMaskWallet
              ? `Connected: ${metaMaskWallet.slice(0, 6)}...${metaMaskWallet.slice(-4)}`
              : "Not Connected"}
          </p>
          {isPremium && (
            <div className="mt-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-1 font-medium text-purple-800 text-xs">
              🎉 Premium
            </div>
          )}
        </div>

        {/* Family Wallet Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">
              Family Wallet
            </h3>
            <div
              className={`h-3 w-3 rounded-full ${familyWallet ? "bg-green-500" : "bg-gray-300"}`}
            />
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            {familyWallet
              ? `Connected: ${familyWallet.slice(0, 6)}...${familyWallet.slice(-4)}`
              : "Not Connected"}
          </p>
          <p className="mt-1 text-gray-500 text-xs">
            {lensProfiles.length} Lens profile(s) found
          </p>
        </div>

        {/* Connection Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">Status</h3>
            <div
              className={`h-3 w-3 rounded-full ${isLinked ? "bg-green-500" : "bg-yellow-500"}`}
            />
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            {isLinked ? "Wallets Linked" : "Not Linked"}
          </p>
          {selectedProfile && (
            <p className="mt-1 text-gray-500 text-xs">
              Profile: {selectedProfile.id}
            </p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-lg bg-white shadow-md">
        <WalletConnectionFlow
          onError={(error) => console.error("Error:", error)}
          onSuccess={() => console.log("Wallets linked successfully!")}
        />
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 font-semibold text-blue-900 text-lg">
          How it works:
        </h3>
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="flex items-start">
            <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 font-bold text-xs">
              1
            </span>
            <div>
              <strong>Connect MetaMask:</strong> Your MetaMask wallet is used
              for premium registration and rewards
            </div>
          </div>
          <div className="flex items-start">
            <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 font-bold text-xs">
              2
            </span>
            <div>
              <strong>Connect Family Wallet:</strong> Your Family Wallet is used
              for Lens profile management
            </div>
          </div>
          <div className="flex items-start">
            <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 font-bold text-xs">
              3
            </span>
            <div>
              <strong>Select Profile:</strong> Choose which Lens profile to link
              to your premium account
            </div>
          </div>
          <div className="flex items-start">
            <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 font-bold text-xs">
              4
            </span>
            <div>
              <strong>Link & Enjoy:</strong> Your wallets are now linked and you
              have full access to premium features
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
