import { useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import mainnodeAbi from "../../abi/mainnode.json";
import { CONTRACT_ADDRESSES, ROLES } from "../../lib/contracts";

const MainNodeContractManager = () => {
  const { writeContract } = useWriteContract();

  // State for reward management
  const [isRewardReferralLoading, setIsRewardReferralLoading] = useState(false);
  const [isClaimRewardLoading, setIsClaimRewardLoading] = useState(false);

  // State for system configuration
  const [partnerAddress, setPartnerAddress] = useState("");
  const [referralAddress, setReferralAddress] = useState("");
  const [isSetPartnerLoading, setIsSetPartnerLoading] = useState(false);
  const [isSetReferralLoading, setIsSetReferralLoading] = useState(false);

  // State for access control
  const [selectedRole, setSelectedRole] = useState<string>(
    ROLES.DEFAULT_ADMIN_ROLE
  );
  const [targetAddress, setTargetAddress] = useState("");
  const [isRoleActionLoading, setIsRoleActionLoading] = useState(false);

  // Reward Management Functions
  const handleRewardReferral = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    setIsRewardReferralLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      functionName: "rewardReferral"
    });
    toast.success("Reward referral transaction submitted");
    setIsRewardReferralLoading(false);
  };

  const handleClaimReward = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    setIsClaimRewardLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      functionName: "claimReward"
    });
    toast.success("Claim reward transaction submitted");
    setIsClaimRewardLoading(false);
  };

  // System Configuration Functions
  const handleSetPartner = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    if (!partnerAddress || !/^0x[a-fA-F0-9]{40}$/.test(partnerAddress)) {
      toast.error("Please enter a valid partner address");
      return;
    }

    setIsSetPartnerLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      args: [partnerAddress],
      functionName: "setPartner"
    });
    toast.success("Partner address updated successfully");
    setPartnerAddress("");
    setIsSetPartnerLoading(false);
  };

  const handleSetReferral = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    if (!referralAddress || !/^0x[a-fA-F0-9]{40}$/.test(referralAddress)) {
      toast.error("Please enter a valid referral address");
      return;
    }

    setIsSetReferralLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      args: [referralAddress],
      functionName: "setReferral"
    });
    toast.success("Referral address updated successfully");
    setReferralAddress("");
    setIsSetReferralLoading(false);
  };

  // Access Control Functions
  const handleGrantRole = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    if (!targetAddress || !/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      toast.error("Please enter a valid target address");
      return;
    }

    setIsRoleActionLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      args: [selectedRole, targetAddress],
      functionName: "grantRole"
    });
    toast.success("Role granted successfully");
    setTargetAddress("");
    setIsRoleActionLoading(false);
  };

  const handleRevokeRole = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    if (!targetAddress || !/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      toast.error("Please enter a valid target address");
      return;
    }

    setIsRoleActionLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      args: [selectedRole, targetAddress],
      functionName: "revokeRole"
    });
    toast.success("Role revoked successfully");
    setTargetAddress("");
    setIsRoleActionLoading(false);
  };

  const handleRenounceRole = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    setIsRoleActionLoading(true);
    writeContract({
      abi: mainnodeAbi,
      address: CONTRACT_ADDRESSES.MAIN_NODE,
      args: [selectedRole],
      functionName: "renounceRole"
    });
    toast.success("Role renounced successfully");
    setIsRoleActionLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Reward Management Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">
          Reward Management
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            disabled={isRewardReferralLoading}
            onClick={handleRewardReferral}
          >
            {isRewardReferralLoading ? "Processing..." : "Reward Referral"}
          </button>
          <button
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            disabled={isClaimRewardLoading}
            onClick={handleClaimReward}
          >
            {isClaimRewardLoading ? "Processing..." : "Claim Reward"}
          </button>
        </div>
      </div>

      {/* System Configuration Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">
          System Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Partner Address
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setPartnerAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={partnerAddress}
              />
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                disabled={isSetPartnerLoading}
                onClick={handleSetPartner}
              >
                {isSetPartnerLoading ? "Setting..." : "Set Partner"}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Referral Address
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setReferralAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={referralAddress}
              />
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                disabled={isSetReferralLoading}
                onClick={handleSetReferral}
              >
                {isSetReferralLoading ? "Setting..." : "Set Referral"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">
          Access Control
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm" htmlFor="role-select">
              Role
            </label>
            <select
              id="role-select"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedRole(e.target.value)}
              value={selectedRole}
            >
              <option value={ROLES.DEFAULT_ADMIN_ROLE}>
                Default Admin Role
              </option>
              <option value={ROLES.KEEPER_ROLE}>Keeper Role</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Target Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              type="text"
              value={targetAddress}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <button
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              disabled={isRoleActionLoading}
              onClick={handleGrantRole}
            >
              {isRoleActionLoading ? "Processing..." : "Grant Role"}
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              disabled={isRoleActionLoading}
              onClick={handleRevokeRole}
            >
              {isRoleActionLoading ? "Processing..." : "Revoke Role"}
            </button>
            <button
              className="rounded-lg bg-yellow-600 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-700 disabled:opacity-50"
              disabled={isRoleActionLoading}
              onClick={handleRenounceRole}
            >
              {isRoleActionLoading ? "Processing..." : "Renounce Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNodeContractManager;
