import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import referralAbi from "../../abi/referral.json";
import { Button, Card, CardHeader, Modal } from "../Shared/UI";
import { CONTRACT_ADDRESSES, ROLES } from "../../lib/contracts";

// Contract addresses
const REFERRAL_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.REFERRAL;

interface FeeSettings {
  registryAmount: string;
  firstFeePercent: string;
  secondFeePercent: string;
  thirdFeePercent: string;
  firstFeeRange: string;
  secondFeeRange: string;
  maxDailyPayment: string;
  maxValueOfPoint: string;
}

interface VaultPercentages {
  referral: string;
  game: string;
  dev: string;
  vip: string;
  unbalanced: string;
}

const ReferralContractManager = () => {
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showAccessControlModal, setShowAccessControlModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>(
    ROLES.DEFAULT_ADMIN_ROLE
  );
  const [targetAddress, setTargetAddress] = useState("");
  const [actionType, setActionType] = useState<"grant" | "revoke" | "renounce">(
    "grant"
  );
  const [feeSettings, setFeeSettings] = useState<FeeSettings>({
    firstFeePercent: "",
    firstFeeRange: "",
    maxDailyPayment: "",
    maxValueOfPoint: "",
    registryAmount: "",
    secondFeePercent: "",
    secondFeeRange: "",
    thirdFeePercent: ""
  });
  const [vaultPercentages, setVaultPercentages] = useState<VaultPercentages>({
    dev: "",
    game: "",
    referral: "",
    unbalanced: "",
    vip: ""
  });

  const { writeContract, isPending } = useWriteContract();

  const handleFeeSettingsSubmit = () => {
    if (feeSettings.registryAmount) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [BigInt(feeSettings.registryAmount)],
        functionName: "setRegistryAmount"
      });
    }

    if (feeSettings.firstFeePercent) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [Number.parseInt(feeSettings.firstFeePercent)],
        functionName: "setFirstFeePercent"
      });
    }

    if (feeSettings.secondFeePercent) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [Number.parseInt(feeSettings.secondFeePercent)],
        functionName: "setSecondFeePercent"
      });
    }

    if (feeSettings.thirdFeePercent) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [Number.parseInt(feeSettings.thirdFeePercent)],
        functionName: "setThirdFeePercent"
      });
    }

    if (feeSettings.firstFeeRange) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [BigInt(feeSettings.firstFeeRange)],
        functionName: "setFirstFeeRange"
      });
    }

    if (feeSettings.secondFeeRange) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [BigInt(feeSettings.secondFeeRange)],
        functionName: "setSecondFeeRange"
      });
    }

    if (feeSettings.maxDailyPayment) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [BigInt(feeSettings.maxDailyPayment)],
        functionName: "setMaxDailyPayment"
      });
    }

    if (feeSettings.maxValueOfPoint) {
      writeContract({
        abi: referralAbi,
        address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
        args: [BigInt(feeSettings.maxValueOfPoint)],
        functionName: "setMaxValueOfPoint"
      });
    }

    toast.success("Fee settings submitted successfully");
    setShowFeeModal(false);
    setFeeSettings({
      firstFeePercent: "",
      firstFeeRange: "",
      maxDailyPayment: "",
      maxValueOfPoint: "",
      registryAmount: "",
      secondFeePercent: "",
      secondFeeRange: "",
      thirdFeePercent: ""
    });
  };

  const handleVaultPercentagesSubmit = () => {
    writeContract({
      abi: referralAbi,
      address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
      args: [
        Number.parseInt(vaultPercentages.referral),
        Number.parseInt(vaultPercentages.game),
        Number.parseInt(vaultPercentages.dev),
        Number.parseInt(vaultPercentages.vip),
        Number.parseInt(vaultPercentages.unbalanced)
      ],
      functionName: "setVaultPercentages"
    });

    toast.success("Vault percentages submitted successfully");
    setShowVaultModal(false);
    setVaultPercentages({
      dev: "",
      game: "",
      referral: "",
      unbalanced: "",
      vip: ""
    });
  };

  const handleRewardCalculation = () => {
    setPendingAction("rewardCalculation");
    setShowConfirmationModal(true);
  };

  const handleUnbalancedRewardCalculation = () => {
    setPendingAction("unbalancedRewardCalculation");
    setShowConfirmationModal(true);
  };

  const handleAccessControlAction = () => {
    if (!targetAddress || !selectedRole) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    const functionName =
      actionType === "grant"
        ? "grantRole"
        : actionType === "revoke"
          ? "revokeRole"
          : "renounceRole";
    const args = [selectedRole, targetAddress];

    writeContract({
      abi: referralAbi,
      address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
      args,
      functionName
    });

    toast.success(`Role ${actionType} submitted successfully`);
    setShowAccessControlModal(false);
    setTargetAddress("");
    setSelectedRole(ROLES.DEFAULT_ADMIN_ROLE);
  };

  const _openAccessControlModal = (type: "grant" | "revoke" | "renounce") => {
    setActionType(type);
    setShowAccessControlModal(true);
  };

  const executePendingAction = () => {
    const functionName =
      pendingAction === "rewardCalculation"
        ? "rewardCalculation"
        : "unbalancedRewardCalculation";

    writeContract({
      abi: referralAbi,
      address: REFERRAL_CONTRACT_ADDRESS as `0x${string}`,
      args: [],
      functionName
    });

    toast.success(`${pendingAction} submitted successfully`);
    setShowConfirmationModal(false);
    setPendingAction("");
  };

  const sections = [
    {
      action: () => setShowFeeModal(true),
      actionText: "Configure Fees",
      color: "blue",
      description: "Configure registration costs and fee percentages",
      icon: CurrencyDollarIcon,
      title: "Registration & Fee Management"
    },
    {
      action: () => setShowVaultModal(true),
      actionText: "Set Distribution",
      color: "green",
      description: "Set how incoming funds are distributed across vaults",
      icon: BanknotesIcon,
      title: "Vault Fund Distribution"
    },
    {
      action: handleRewardCalculation,
      actionText: "Calculate Rewards",
      color: "purple",
      description: "Trigger reward calculation processes",
      icon: PlayIcon,
      title: "Reward Calculation"
    },
    {
      action: handleUnbalancedRewardCalculation,
      actionText: "Calculate Unbalanced",
      color: "orange",
      description: "Process unbalanced reward calculations",
      icon: ExclamationTriangleIcon,
      title: "Unbalanced Reward Calculation"
    },
    {
      action: () => setShowAccessControlModal(true),
      actionText: "Manage Roles",
      color: "red",
      description: "Grant, revoke, and renounce roles for access control",
      icon: ShieldCheckIcon,
      title: "Access Control & Roles"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center space-x-3">
        <UserGroupIcon className="h-6 w-6 text-blue-600" />
        <h2 className="font-bold text-2xl text-gray-900">
          Referral Contract Management
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const colorClasses = {
            blue: "border-blue-200 bg-blue-50",
            green: "border-green-200 bg-green-50",
            orange: "border-orange-200 bg-orange-50",
            purple: "border-purple-200 bg-purple-50",
            red: "border-red-200 bg-red-50"
          };

          return (
            <Card
              className={`border-2 ${colorClasses[section.color as keyof typeof colorClasses]}`}
              key={section.title}
            >
              <CardHeader
                icon={<Icon className="h-6 w-6 text-gray-600" />}
                title={section.title}
              />
              <div className="p-6">
                <p className="mb-4 text-gray-600">{section.description}</p>
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={section.action}
                >
                  {isPending ? "Processing..." : section.actionText}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fee Settings Modal */}
      <Modal
        onClose={() => setShowFeeModal(false)}
        show={showFeeModal}
        title="Configure Fee Settings"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Registry Amount (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    registryAmount: e.target.value
                  }))
                }
                placeholder="Enter amount in wei"
                type="number"
                value={feeSettings.registryAmount}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                First Fee Percent
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    firstFeePercent: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={feeSettings.firstFeePercent}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Second Fee Percent
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    secondFeePercent: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={feeSettings.secondFeePercent}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Third Fee Percent
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    thirdFeePercent: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={feeSettings.thirdFeePercent}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                First Fee Range (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    firstFeeRange: e.target.value
                  }))
                }
                placeholder="Enter amount in wei"
                type="number"
                value={feeSettings.firstFeeRange}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Second Fee Range (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    secondFeeRange: e.target.value
                  }))
                }
                placeholder="Enter amount in wei"
                type="number"
                value={feeSettings.secondFeeRange}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Max Daily Payment (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    maxDailyPayment: e.target.value
                  }))
                }
                placeholder="Enter amount in wei"
                type="number"
                value={feeSettings.maxDailyPayment}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Max Value of Point (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  setFeeSettings((prev) => ({
                    ...prev,
                    maxValueOfPoint: e.target.value
                  }))
                }
                placeholder="Enter amount in wei"
                type="number"
                value={feeSettings.maxValueOfPoint}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={() => setShowFeeModal(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleFeeSettingsSubmit}>
              {isPending ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vault Percentages Modal */}
      <Modal
        onClose={() => setShowVaultModal(false)}
        show={showVaultModal}
        title="Set Vault Distribution Percentages"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Referral Vault %
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setVaultPercentages((prev) => ({
                    ...prev,
                    referral: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={vaultPercentages.referral}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Game Vault %
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setVaultPercentages((prev) => ({
                    ...prev,
                    game: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={vaultPercentages.game}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Dev Vault %
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setVaultPercentages((prev) => ({
                    ...prev,
                    dev: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={vaultPercentages.dev}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                VIP Vault %
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setVaultPercentages((prev) => ({
                    ...prev,
                    vip: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={vaultPercentages.vip}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                Unbalanced Vault %
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                max="100"
                min="0"
                onChange={(e) =>
                  setVaultPercentages((prev) => ({
                    ...prev,
                    unbalanced: e.target.value
                  }))
                }
                placeholder="0-100"
                type="number"
                value={vaultPercentages.unbalanced}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={() => setShowVaultModal(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleVaultPercentagesSubmit}>
              {isPending ? "Updating..." : "Update Distribution"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Access Control Modal */}
      <Modal
        onClose={() => setShowAccessControlModal(false)}
        show={showAccessControlModal}
        title="Access Control Management"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Manage roles for the Referral Contract.
              Grant, revoke, or renounce roles as needed.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="role-select"
            >
              Select Role
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
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
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="target-address"
            >
              Target Address
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              id="target-address"
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              type="text"
              value={targetAddress}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <Button
              className="w-full"
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={() => {
                setActionType("grant");
                handleAccessControlAction();
              }}
            >
              {isPending ? "Processing..." : "Grant Role"}
            </Button>
            <Button
              className="w-full"
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={() => {
                setActionType("revoke");
                handleAccessControlAction();
              }}
              variant="outline"
            >
              {isPending ? "Processing..." : "Revoke Role"}
            </Button>
            <Button
              className="w-full"
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={() => {
                setActionType("renounce");
                handleAccessControlAction();
              }}
              variant="destructive"
            >
              {isPending ? "Processing..." : "Renounce Role"}
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowAccessControlModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        onClose={() => setShowConfirmationModal(false)}
        show={showConfirmationModal}
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to execute <strong>{pendingAction}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowConfirmationModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={executePendingAction}
              variant="destructive"
            >
              {isPending ? "Executing..." : "Execute"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReferralContractManager;
