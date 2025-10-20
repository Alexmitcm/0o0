import { useQueryClient } from "@tanstack/react-query";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "@/lib/constants";

const useClaimReferralReward = () => {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash
  });

  const claimReferralReward = () => {
    writeContract({
      abi: REFERRAL_ABI,
      address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
      functionName: "withdraw"
    });
  };

  // Invalidate queries on successful transaction
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["userOnChainState"] });
  }

  return {
    claimReferralReward,
    error,
    hash,
    isPending: isPending || isConfirming,
    isSuccess
  };
};

export default useClaimReferralReward;
