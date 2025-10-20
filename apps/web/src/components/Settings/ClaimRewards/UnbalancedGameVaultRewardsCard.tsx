import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { useContractRead } from "wagmi";
import useClaimUnbalancedGameReward from "@/hooks/useClaimUnbalancedGameReward";
import { GAME_VAULT_ABI, MAINNET_CONTRACTS } from "@/lib/constants";

const UnbalancedGameVaultRewardsCard = () => {
  const { claimUnbalancedGameReward, isPending, isSuccess, error } =
    useClaimUnbalancedGameReward();

  // Read balance from unbalanced game vault
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useContractRead({
    abi: GAME_VAULT_ABI,
    address: MAINNET_CONTRACTS.UNBALANCED_GAME_VAULT as `0x${string}`,
    args: [],
    functionName: "playerBalance"
  });

  const handleClaim = () => {
    claimUnbalancedGameReward();
  };

  // Show success/error notifications
  if (isSuccess) {
    toast.success("Unbalanced Game Vault rewards claimed successfully!");
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
        Unbalanced Game Vault Rewards
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
            : "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
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

export default UnbalancedGameVaultRewardsCard;
