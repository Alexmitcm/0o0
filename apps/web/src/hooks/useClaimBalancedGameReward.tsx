import { useQueryClient } from "@tanstack/react-query";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GAME_VAULT_ABI, MAINNET_CONTRACTS } from "@/lib/constants";

const useClaimBalancedGameReward = () => {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash
  });

  const claimBalancedGameReward = () => {
    writeContract({
      abi: GAME_VAULT_ABI,
      address: MAINNET_CONTRACTS.BALANCED_GAME_VAULT as `0x${string}`,
      functionName: "claimReward"
    });
  };

  // Invalidate queries on successful transaction
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["userGameRewards"] });
  }

  return {
    claimBalancedGameReward,
    error,
    hash,
    isPending: isPending || isConfirming,
    isSuccess
  };
};

export default useClaimBalancedGameReward;
