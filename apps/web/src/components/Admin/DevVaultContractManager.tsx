import { useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import devAbi from "../../abi/dev.json";
import { CONTRACT_ADDRESSES, ROLES } from "../../lib/contracts";

const DevVaultContractManager = () => {
  const { writeContract } = useWriteContract();

  // State for withdraw funds
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [showWithdrawConfirmation, setShowWithdrawConfirmation] =
    useState(false);

  // State for access control
  const [selectedRole, setSelectedRole] = useState<string>(
    ROLES.DEFAULT_ADMIN_ROLE
  );
  const [targetAddress, setTargetAddress] = useState("");
  const [isRoleActionLoading, setIsRoleActionLoading] = useState(false);

  // Withdraw Funds Function
  const handleWithdraw = () => {
    if (!writeContract) {
      toast.error("Wallet not connected");
      return;
    }

    if (!withdrawAddress || !/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)) {
      toast.error("Please enter a valid destination address");
      return;
    }

    setIsWithdrawLoading(true);
    writeContract({
      abi: devAbi,
      address: CONTRACT_ADDRESSES.DEV_VAULT,
      args: [withdrawAddress],
      functionName: "withdraw"
    });
    toast.success("Withdraw transaction submitted");
    setWithdrawAddress("");
    setShowWithdrawConfirmation(false);
    setIsWithdrawLoading(false);
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
      abi: devAbi,
      address: CONTRACT_ADDRESSES.DEV_VAULT,
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
      abi: devAbi,
      address: CONTRACT_ADDRESSES.DEV_VAULT,
      args: [selectedRole, targetAddress],
      functionName: "revokeRole"
    });
    toast.success("Role revoked successfully");
    setTargetAddress("");
    setIsRoleActionLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Withdraw Funds Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900 text-lg">
          Withdraw Funds (Critical Action)
        </h3>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium text-gray-700 text-sm"
              htmlFor="withdraw-address"
            >
              Destination Address
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                id="withdraw-address"
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={withdrawAddress}
              />
              <button
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                disabled={isWithdrawLoading}
                onClick={() => setShowWithdrawConfirmation(true)}
                type="button"
              >
                {isWithdrawLoading ? "Processing..." : "Withdraw All Funds"}
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
            <label
              className="mb-2 block font-medium text-gray-700 text-sm"
              htmlFor="role-select"
            >
              Role
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="role-select"
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
            <label
              className="mb-2 block font-medium text-gray-700 text-sm"
              htmlFor="target-address"
            >
              Target Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="target-address"
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              type="text"
              value={targetAddress}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <button
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              disabled={isRoleActionLoading}
              onClick={handleGrantRole}
              type="button"
            >
              {isRoleActionLoading ? "Processing..." : "Grant Role"}
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              disabled={isRoleActionLoading}
              onClick={handleRevokeRole}
              type="button"
            >
              {isRoleActionLoading ? "Processing..." : "Revoke Role"}
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900 text-lg">
              Confirm Withdraw
            </h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to withdraw all funds to{" "}
              <code className="rounded bg-gray-100 px-2 py-1">
                {withdrawAddress.slice(0, 6)}...{withdrawAddress.slice(-4)}
              </code>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                disabled={isWithdrawLoading}
                onClick={handleWithdraw}
                type="button"
              >
                {isWithdrawLoading ? "Processing..." : "Confirm Withdraw"}
              </button>
              <button
                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-400"
                disabled={isWithdrawLoading}
                onClick={() => setShowWithdrawConfirmation(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevVaultContractManager;
