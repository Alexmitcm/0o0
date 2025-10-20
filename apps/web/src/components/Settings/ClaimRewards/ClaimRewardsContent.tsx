import { useAccount } from "wagmi";
import GameVaultRewardsCard from "./GameVaultRewardsCard";
import ReferralRewardsCard from "./ReferralRewardsCard";
import UnbalancedGameVaultRewardsCard from "./UnbalancedGameVaultRewardsCard";
import UnbalancedNodeCard from "./UnbalancedNodeCard";

const ClaimRewardsContent = () => {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className="p-5 text-center text-gray-500 dark:text-gray-400">
        Please connect your wallet to view and claim rewards.
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <ReferralRewardsCard />
        <GameVaultRewardsCard />
        <UnbalancedGameVaultRewardsCard />
        <UnbalancedNodeCard />
      </div>
    </div>
  );
};

export default ClaimRewardsContent;
