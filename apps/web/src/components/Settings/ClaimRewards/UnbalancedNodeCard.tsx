import { formatUnits } from "viem";
import { useAccount, useContractRead } from "wagmi";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "@/lib/constants";

const UnbalancedNodeCard = () => {
  const { address } = useAccount();

  // Read unbalanced node data using UnbalancedNodeSet function
  const { data: unbalancedNodeData, isLoading: isUnbalancedNodeLoading } =
    useContractRead({
      abi: REFERRAL_ABI,
      address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
      args: address ? [address] : undefined,
      functionName: "UnbalancedNodeSet"
    });

  // Extract payment from unbalanced node data (second element in the returned array)
  const unbalancedNode = unbalancedNodeData
    ? {
        payment:
          unbalancedNodeData &&
          Array.isArray(unbalancedNodeData) &&
          unbalancedNodeData[1]
            ? (unbalancedNodeData[1] as bigint)
            : undefined
      }
    : undefined;

  const formattedPayment = unbalancedNode?.payment
    ? formatUnits(unbalancedNode.payment, 6)
    : "0";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
        Unbalanced Node Info
      </h3>

      <div className="mb-4">
        <div className="text-gray-500 text-sm dark:text-gray-400">
          Payment Amount
        </div>
        <div className="font-bold text-2xl text-gray-900 dark:text-white">
          {isUnbalancedNodeLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            `${Number.parseFloat(formattedPayment).toFixed(4)} USDT`
          )}
        </div>
      </div>

      <div className="text-gray-500 text-sm italic dark:text-gray-400">
        Note: This amount is likely included in your main Referral Rewards and
        can be claimed using the button in the first card.
      </div>
    </div>
  );
};

export default UnbalancedNodeCard;
