import { useAccount } from "wagmi";
import ReferralTreeGraph from "@/components/ReferralTreeGraph";
import cn from "../../helpers/cn";

interface ReferralTreeIntegrationProps {
  className?: string;
}

export default function ReferralTreeIntegration({
  className
}: ReferralTreeIntegrationProps) {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className={cn("rounded-xl border bg-yellow-50 p-6", className)}>
        <h3 className="mb-2 font-semibold text-lg text-yellow-800">
          Connect Wallet
        </h3>
        <p className="text-yellow-700">
          Please connect your wallet to view your referral tree.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold text-gray-900 text-lg">
          Your Referral Network
        </h3>
        <p className="text-gray-600 text-sm">
          View your referral tree structure and track your network's
          performance.
        </p>
      </div>

      <ReferralTreeGraph maxDepth={5} walletAddress={address} />
    </div>
  );
}
