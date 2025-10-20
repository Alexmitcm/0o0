import { useAccount, useReadContract } from "wagmi";
import { GAME_VAULT_ABI, MAINNET_CONTRACTS } from "@/lib/constants";

interface UserGameRewards {
  balanced: bigint;
  unbalanced: bigint;
}

const useUserGameRewards = () => {
  const { address } = useAccount();

  const {
    data: balancedBalance,
    isLoading: isBalancedLoading,
    error: balancedError
  } = useReadContract({
    abi: GAME_VAULT_ABI,
    address: MAINNET_CONTRACTS.BALANCED_GAME_VAULT as `0x${string}`,
    args: [],
    functionName: "playerBalance",
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 30000
    }
  });

  const {
    data: unbalancedBalance,
    isLoading: isUnbalancedLoading,
    error: unbalancedError
  } = useReadContract({
    abi: GAME_VAULT_ABI,
    address: MAINNET_CONTRACTS.UNBALANCED_GAME_VAULT as `0x${string}`,
    args: [],
    functionName: "playerBalance",
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 30000
    }
  });

  const isLoading = isBalancedLoading || isUnbalancedLoading;
  const error = balancedError || unbalancedError;

  const data: UserGameRewards | undefined =
    balancedBalance !== undefined &&
    unbalancedBalance !== undefined &&
    balancedBalance !== null &&
    unbalancedBalance !== null
      ? {
          balanced: balancedBalance as bigint,
          unbalanced: unbalancedBalance as bigint
        }
      : undefined;

  return {
    data,
    error,
    isLoading,
    refetch: () => {
      // Note: In a real implementation, you might want to trigger refetch for both contracts
      // This is a simplified version
    }
  };
};

export default useUserGameRewards;
