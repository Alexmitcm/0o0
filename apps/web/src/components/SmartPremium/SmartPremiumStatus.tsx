import { useSmartPremiumContext } from "./SmartPremiumProvider";

export const SmartPremiumStatus = () => {
  const {
    metaMaskWallet,
    familyWallet,
    isPremium,
    wasAlreadyPremium,
    isLinked,
    message,
    isLoading
  } = useSmartPremiumContext();

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!metaMaskWallet) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
          <svg
            className="h-6 w-6 text-gray-400"
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
        <h3 className="mb-2 font-semibold text-gray-900 text-lg">
          Connect MetaMask
        </h3>
        <p className="text-gray-600">
          Please connect your MetaMask wallet to check premium status
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MetaMask Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">
            MetaMask Wallet
          </h3>
          <div
            className={`h-3 w-3 rounded-full ${metaMaskWallet ? "bg-green-500" : "bg-gray-300"}`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            <strong>Address:</strong> {metaMaskWallet.slice(0, 6)}...
            {metaMaskWallet.slice(-4)}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 text-sm">
              Premium Status:
            </span>
            {isPremium ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 font-medium text-green-800 text-xs">
                ✅ Premium
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 font-medium text-red-800 text-xs">
                ❌ Not Premium
              </span>
            )}
          </div>

          {wasAlreadyPremium && (
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    fillRule="evenodd"
                  />
                </svg>
                <p className="text-blue-800 text-sm">
                  <strong>Already Premium:</strong> You were already registered
                  in our system!
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-gray-700 text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Family Wallet Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Family Wallet</h3>
          <div
            className={`h-3 w-3 rounded-full ${familyWallet ? "bg-green-500" : "bg-gray-300"}`}
          />
        </div>

        {familyWallet ? (
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">
              <strong>Address:</strong> {familyWallet.slice(0, 6)}...
              {familyWallet.slice(-4)}
            </p>
            <p className="text-gray-600 text-sm">
              <strong>Status:</strong> Connected for Lens profile management
            </p>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Not connected</p>
        )}
      </div>

      {/* Overall Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">
            Overall Status
          </h3>
          <div
            className={`h-3 w-3 rounded-full ${isLinked ? "bg-green-500" : "bg-yellow-500"}`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            <strong>Wallets Linked:</strong> {isLinked ? "Yes" : "No"}
          </p>
          <p className="text-gray-600 text-sm">
            <strong>Premium Access:</strong> {isPremium ? "Yes" : "No"}
          </p>

          {isLinked && (
            <div className="rounded-lg bg-green-50 p-3">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                <p className="text-green-800 text-sm">
                  <strong>Success!</strong> Your wallets are linked and you have
                  premium access.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
