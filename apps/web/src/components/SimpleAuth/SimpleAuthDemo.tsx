import { SimpleLoginButton, SimplePremiumBadge } from "./index";
import { useSimpleAuthContext } from "./SimpleAuthProvider";

export const SimpleAuthDemo = () => {
  const { user, isLoggedIn, isPremium, isLoading, error } =
    useSimpleAuthContext();

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-8 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 font-bold text-xl">Simple Auth Demo</h2>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {isLoggedIn ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <SimplePremiumBadge size="md" />
          </div>

          <div className="text-gray-600 text-sm">
            <p>
              <strong>Wallet:</strong> {user?.walletAddress}
            </p>
            <p>
              <strong>Profile:</strong> {user?.profileId || "None"}
            </p>
            <p>
              <strong>Premium:</strong> {isPremium ? "Yes" : "No"}
            </p>
            {user?.displayName && (
              <p>
                <strong>Name:</strong> {user.displayName}
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-gray-500 text-sm">
              {isPremium
                ? "🎉 You have premium access!"
                : "Upgrade to premium for exclusive features"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect your wallet and select a profile to login
          </p>
          <SimpleLoginButton
            onError={(error) => console.error("Login error:", error)}
            onSuccess={() => console.log("Login successful!")}
          />
        </div>
      )}
    </div>
  );
};
