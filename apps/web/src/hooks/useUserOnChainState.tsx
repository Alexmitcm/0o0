import { useAccount, useReadContract } from "wagmi";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "@/lib/constants";

interface UserOnChainState {
  referralRewardBalance: bigint;
  leftNodeCount: number;
  rightNodeCount: number;
  accountAgeInDays: number;
  directReferrals: {
    leftChild: string;
    rightChild: string;
  };
}

const useUserOnChainState = () => {
  const { address } = useAccount();

  const {
    data: nodeData,
    isLoading,
    error,
    refetch
  } = useReadContract({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: address ? [address] : undefined,
    functionName: "NodeSet",
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 30000 // 30 seconds
    }
  });

  if (!nodeData || !Array.isArray(nodeData)) {
    return {
      data: undefined,
      error,
      isLoading,
      refetch
    };
  }

  const [
    startTime,
    balance,
    ,
    depthLeftBranch,
    depthRightBranch,
    ,
    ,
    ,
    leftChild,
    rightChild
  ] = nodeData;

  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const accountAgeInSeconds = currentTime - startTime;
  const accountAgeInDays = Number(accountAgeInSeconds) / (24 * 60 * 60);

  const data: UserOnChainState = {
    accountAgeInDays: Math.floor(accountAgeInDays),
    directReferrals: {
      leftChild: leftChild as string,
      rightChild: rightChild as string
    },
    leftNodeCount: Number(depthLeftBranch),
    referralRewardBalance: balance,
    rightNodeCount: Number(depthRightBranch)
  };

  return {
    data,
    error,
    isLoading,
    refetch
  };
};

export default useUserOnChainState;
