import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { useContractRead } from "wagmi";
import useClaimBalancedGameReward from "@/hooks/useClaimBalancedGameReward";
import { GAME_VAULT_ABI, MAINNET_CONTRACTS } from "@/lib/constants";

const GameVaultRewardsCard = () => {
  const { claimBalancedGameReward, isPending, isSuccess, error } =
    useClaimBalancedGameReward();

  // Read balance
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useContractRead({
    abi: GAME_VAULT_ABI,
    address: MAINNET_CONTRACTS.BALANCED_GAME_VAULT as `0x${string}`,
    args: [],
    functionName: "playerBalance"
  });

  const handleClaim = () => {
    claimBalancedGameReward();
  };

  // Show success/error notifications
  if (isSuccess) {
    toast.success("Game Vault rewards claimed successfully!");
    refetchBalance();
  }

  if (error) {
    toast.error(`Failed to claim rewards: ${error.message}`);
  }

  const formattedBalance = balance ? formatUnits(balance as bigint, 6) : "0";
  const isDisabled = !balance || balance === 0n || isPending;
  const isLoading = isBalanceLoading || isPending;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
        Balanced Game Vault Rewards
      </h3>

      <div className="mb-4">
        <div className="text-gray-500 text-sm dark:text-gray-400">
          Available Balance
        </div>
        <div className="font-bold text-2xl text-gray-900 dark:text-white">
          {isBalanceLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            `${Number.parseFloat(formattedBalance).toFixed(4)} USDT`
          )}
        </div>
      </div>

      <button
        className={`w-full rounded-lg px-4 py-2 font-medium transition-colors ${
          isDisabled
            ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
            : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        }`}
        disabled={isDisabled}
        onClick={handleClaim}
        type="button"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </div>
        ) : (
          "Claim"
        )}
      </button>

      {error && (
        <div className="mt-2 text-red-500 text-sm">{error.message}</div>
      )}
    </div>
  );
};

export default GameVaultRewardsCard;
