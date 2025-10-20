import { formatEther } from "viem";
import { useAccount, useConnect } from "wagmi";
import {
  useClaimBalancedGameReward,
  useClaimReferralReward,
  useClaimUnbalancedGameReward,
  useUserGameRewards,
  useUserOnChainState
} from "@/hooks";

const OnChainProDashboard = () => {
  const { address } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();

  // Fetch on-chain data
  const {
    data: userState,
    isLoading: isUserStateLoading,
    error: userStateError
  } = useUserOnChainState();
  const {
    data: gameRewards,
    isLoading: isGameRewardsLoading,
    error: gameRewardsError
  } = useUserGameRewards();

  // Claim hooks
  const { claimReferralReward, isPending: isClaimingReferral } =
    useClaimReferralReward();
  const { claimBalancedGameReward, isPending: isClaimingBalanced } =
    useClaimBalancedGameReward();
  const { claimUnbalancedGameReward, isPending: isClaimingUnbalanced } =
    useClaimUnbalancedGameReward();

  const handleConnectWallet = async () => {
    try {
      // Try to connect with MetaMask (injected connector)
      const injectedConnector = connectors.find(
        (connector) => connector.id === "injected"
      );
      if (injectedConnector) {
        await connectAsync({ connector: injectedConnector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Loading state
  if (isUserStateLoading || isGameRewardsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">Loading on-chain data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (userStateError || gameRewardsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <p className="mb-4 text-gray-600">Failed to load on-chain data</p>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No wallet connected
  if (!address) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-blue-500">
            <svg
              className="mx-auto h-12 w-12"
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
          <p className="mb-4 text-gray-600">
            Please connect your wallet to view on-chain data
          </p>
          <button
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isConnecting}
            onClick={handleConnectWallet}
            type="button"
          >
            {isConnecting ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                Connecting...
              </div>
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-2xl">On-Chain Pro Dashboard</h1>
                <p className="text-blue-100">
                  Real-time blockchain data and rewards
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm">Wallet Address</div>
              <div className="font-mono text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Your Assets Section */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-semibold text-gray-900 text-xl">
                Your Assets
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Referral Rewards Card */}
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6">
                  <div className="mb-4 flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Referral Rewards
                    </h3>
                  </div>
                  <div className="mb-2 font-bold text-2xl text-gray-900">
                    {userState?.referralRewardBalance
                      ? formatEther(userState.referralRewardBalance)
                      : "0"}{" "}
                    USDT
                  </div>
                  <p className="text-gray-600 text-sm">
                    Claimable referral rewards
                  </p>
                </div>

                {/* Unbalanced Game Vault Card */}
                <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                  <div className="mb-4 flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Unbalanced Game Vault
                    </h3>
                  </div>
                  <div className="mb-2 font-bold text-2xl text-gray-900">
                    {gameRewards?.unbalanced
                      ? formatEther(gameRewards.unbalanced)
                      : "0"}{" "}
                    USDT
                  </div>
                  <p className="text-gray-600 text-sm">
                    Unbalanced game rewards
                  </p>
                </div>

                {/* Balanced Game Vault Card */}
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <div className="mb-4 flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <svg
                        className="h-5 w-5 text-white"
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
                    <h3 className="font-semibold text-gray-900">Game Vault</h3>
                  </div>
                  <div className="mb-2 font-bold text-2xl text-gray-900">
                    {gameRewards?.balanced
                      ? formatEther(gameRewards.balanced)
                      : "0"}{" "}
                    USDT
                  </div>
                  <p className="text-gray-600 text-sm">Balanced game rewards</p>
                </div>
              </div>
            </div>

            {/* Claim Section */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-semibold text-gray-900 text-xl">
                Claim Rewards
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Claim Referral Button */}
                <button
                  className="rounded-lg bg-green-600 px-4 py-3 font-medium text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  disabled={
                    isClaimingReferral ||
                    !userState?.referralRewardBalance ||
                    userState.referralRewardBalance === 0n
                  }
                  onClick={claimReferralReward}
                  type="button"
                >
                  {isClaimingReferral ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                      Claiming...
                    </div>
                  ) : (
                    `Claim Referral (${userState?.referralRewardBalance ? formatEther(userState.referralRewardBalance) : "0"} USDT)`
                  )}
                </button>

                {/* Claim Unbalanced Button */}
                <button
                  className="rounded-lg bg-orange-600 px-4 py-3 font-medium text-sm text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  disabled={
                    isClaimingUnbalanced ||
                    !gameRewards?.unbalanced ||
                    gameRewards.unbalanced === 0n
                  }
                  onClick={claimUnbalancedGameReward}
                  type="button"
                >
                  {isClaimingUnbalanced ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                      Claiming...
                    </div>
                  ) : (
                    `Claim Unbalanced (${gameRewards?.unbalanced ? formatEther(gameRewards.unbalanced) : "0"} USDT)`
                  )}
                </button>

                {/* Claim Balanced Button */}
                <button
                  className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  disabled={
                    isClaimingBalanced ||
                    !gameRewards?.balanced ||
                    gameRewards.balanced === 0n
                  }
                  onClick={claimBalancedGameReward}
                  type="button"
                >
                  {isClaimingBalanced ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                      Claiming...
                    </div>
                  ) : (
                    `Claim Game (${gameRewards?.balanced ? formatEther(gameRewards.balanced) : "0"} USDT)`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg">
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs">
                    Premium
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Age</span>
                  <span className="font-medium text-gray-900">
                    {userState?.accountAgeInDays || 0} days
                  </span>
                </div>
              </div>
            </div>

            {/* Referral Program */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg">
                Referral Program
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Left Node</span>
                  <span className="font-medium text-gray-900">
                    {userState?.leftNodeCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Right Node</span>
                  <span className="font-medium text-gray-900">
                    {userState?.rightNodeCount || 0}
                  </span>
                </div>
                <div className="border-gray-200 border-t pt-3">
                  <div className="mb-2 text-gray-600 text-sm">
                    Direct Referrals
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-gray-500 text-xs">
                      Left:{" "}
                      {userState?.directReferrals?.leftChild
                        ? userState.directReferrals.leftChild.slice(0, 6) +
                          "..." +
                          userState.directReferrals.leftChild.slice(-4)
                        : "None"}
                    </div>
                    <div className="font-mono text-gray-500 text-xs">
                      Right:{" "}
                      {userState?.directReferrals?.rightChild
                        ? userState.directReferrals.rightChild.slice(0, 6) +
                          "..." +
                          userState.directReferrals.rightChild.slice(-4)
                        : "None"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900 text-lg">
                Network Info
              </h3>
              <p className="mb-4 text-gray-600 text-sm">
                All data is fetched directly from smart contracts on Arbitrum
                One.
              </p>
              <div className="text-gray-500 text-xs">
                <div>Network: Arbitrum One</div>
                <div>Chain ID: 42161</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnChainProDashboard;
