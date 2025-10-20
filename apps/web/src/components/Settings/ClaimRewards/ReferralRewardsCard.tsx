import { toast } from "react-hot-toast";
import { formatUnits } from "viem";
import { useAccount, useContractRead } from "wagmi";
import useClaimReferralReward from "@/hooks/useClaimReferralReward";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "@/lib/constants";

const ReferralRewardsCard = () => {
  const { address } = useAccount();
  const { claimReferralReward, isPending, isSuccess, error } =
    useClaimReferralReward();

  // Read balance using NodeSet function (same as existing hook)
  const {
    data: nodeData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useContractRead({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: address ? [address] : undefined,
    functionName: "NodeSet"
  });

  // Extract balance from node data (second element in the returned array)
  const balance =
    nodeData && Array.isArray(nodeData) && nodeData[1]
      ? (nodeData[1] as bigint)
      : undefined;

  const handleClaim = () => {
    claimReferralReward();
  };

  // Show success/error notifications
  if (isSuccess) {
    toast.success("Referral rewards claimed successfully!");
    refetchBalance();
  }

  if (error) {
    toast.error(`Failed to claim rewards: ${error.message}`);
  }

  const formattedBalance = balance ? formatUnits(balance, 6) : "0";
  const isDisabled = !balance || balance === 0n || isPending;
  const isLoading = isBalanceLoading || isPending;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
        Referral Rewards
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
            : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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

export default ReferralRewardsCard;
