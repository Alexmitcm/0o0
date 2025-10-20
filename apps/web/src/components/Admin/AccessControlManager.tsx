import {
  CodeBracketIcon,
  KeyIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import devAbi from "../../abi/dev.json";
import gameVaultAbi from "../../abi/gameVault.json";
import mainnodeAbi from "../../abi/mainnode.json";
import referralAbi from "../../abi/referral.json";
import { Button, Card, CardHeader, Modal } from "../Shared/UI";
import { CONTRACT_ADDRESSES, ROLES } from "../../lib/contracts";

// Contract addresses
const REFERRAL_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.REFERRAL;
const GAME_VAULT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.GAME_VAULT;
const MAIN_NODE_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.MAIN_NODE;
const DEV_VAULT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.DEV_VAULT;

const AccessControlManager = () => {
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRenounceModal, setShowRenounceModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<
    "referral" | "gameVault" | "mainNode" | "devVault"
  >("referral");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState("");
  const [actionType, setActionType] = useState<"grant" | "revoke" | "renounce">(
    "grant"
  );

  const { writeContract, isPending } = useWriteContract();

  const handleRoleAction = () => {
    if (!targetAddress || !selectedRole) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    let contractAddress: string;
    let abi: any;

    switch (selectedContract) {
      case "referral":
        contractAddress = REFERRAL_CONTRACT_ADDRESS;
        abi = referralAbi;
        break;
      case "gameVault":
        contractAddress = GAME_VAULT_CONTRACT_ADDRESS;
        abi = gameVaultAbi;
        break;
      case "mainNode":
        contractAddress = MAIN_NODE_CONTRACT_ADDRESS;
        abi = mainnodeAbi;
        break;
      case "devVault":
        contractAddress = DEV_VAULT_CONTRACT_ADDRESS;
        abi = devAbi;
        break;
      default:
        contractAddress = REFERRAL_CONTRACT_ADDRESS;
        abi = referralAbi;
    }

    const functionName =
      actionType === "grant"
        ? "grantRole"
        : actionType === "revoke"
          ? "revokeRole"
          : "renounceRole";

    writeContract({
      abi,
      address: contractAddress as `0x${string}`,
      args: [selectedRole, targetAddress as `0x${string}`],
      functionName
    });

    toast.success(`Role ${actionType} submitted successfully`);
    setShowGrantModal(false);
    setShowRevokeModal(false);
    setShowRenounceModal(false);
    setTargetAddress("");
    setSelectedRole("");
  };

  const openGrantModal = () => {
    setActionType("grant");
    setShowGrantModal(true);
  };

  const openRevokeModal = () => {
    setActionType("revoke");
    setShowRevokeModal(true);
  };

  const openRenounceModal = () => {
    setActionType("renounce");
    setShowRenounceModal(true);
  };

  const contracts = [
    {
      color: "blue",
      description: "Manage roles for the referral system",
      icon: ShieldCheckIcon,
      id: "referral",
      name: "Referral Contract"
    },
    {
      color: "green",
      description: "Manage roles for the game vault system",
      icon: KeyIcon,
      id: "gameVault",
      name: "Game Vault Contract"
    },
    {
      color: "purple",
      description: "Manage roles for the main node system",
      icon: ServerIcon,
      id: "mainNode",
      name: "Main Node Contract"
    },
    {
      color: "orange",
      description: "Manage roles for the developer vault system",
      icon: CodeBracketIcon,
      id: "devVault",
      name: "Dev Vault Contract"
    }
  ];

  const roleOptions = [
    {
      description: "Full administrative access",
      label: "Default Admin Role",
      value: ROLES.DEFAULT_ADMIN_ROLE
    },
    {
      description: "Limited administrative access",
      label: "Keeper Role",
      value: ROLES.KEEPER_ROLE
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center space-x-3">
        <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
        <h2 className="font-bold text-2xl text-gray-900">
          Access Control Management
        </h2>
      </div>

      {/* Contract Selection */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {contracts.map((contract) => {
          const Icon = contract.icon;
          const colorClasses = {
            blue: "border-blue-200 bg-blue-50",
            green: "border-green-200 bg-green-50"
          };

          return (
            <Card
              className={`cursor-pointer border-2 transition-all duration-200 ${
                selectedContract === contract.id
                  ? colorClasses[contract.color as keyof typeof colorClasses] +
                    " ring-2 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              key={contract.id}
              onClick={() =>
                setSelectedContract(
                  contract.id as
                    | "referral"
                    | "gameVault"
                    | "mainNode"
                    | "devVault"
                )
              }
            >
              <CardHeader
                icon={<Icon className="h-6 w-6 text-gray-600" />}
                title={contract.name}
              />
              <div className="p-6">
                <p className="mb-4 text-gray-600">{contract.description}</p>
                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContract(
                        contract.id as
                          | "referral"
                          | "gameVault"
                          | "mainNode"
                          | "devVault"
                      );
                      openGrantModal();
                    }}
                  >
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                    Grant Role
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContract(
                        contract.id as
                          | "referral"
                          | "gameVault"
                          | "mainNode"
                          | "devVault"
                      );
                      openRevokeModal();
                    }}
                    outline
                  >
                    <UserMinusIcon className="mr-2 h-4 w-4" />
                    Revoke Role
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContract(
                        contract.id as
                          | "referral"
                          | "gameVault"
                          | "mainNode"
                          | "devVault"
                      );
                      openRenounceModal();
                    }}
                    outline
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Renounce Role
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Contract Info */}
      {selectedContract && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader
            title={`Managing: ${contracts.find((c) => c.id === selectedContract)?.name}`}
          />
          <div className="p-6">
            <p className="text-gray-600">
              Contract Address:{" "}
              <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                {selectedContract === "referral"
                  ? REFERRAL_CONTRACT_ADDRESS
                  : GAME_VAULT_CONTRACT_ADDRESS}
              </code>
            </p>
          </div>
        </Card>
      )}

      {/* Grant Role Modal */}
      <Modal
        onClose={() => setShowGrantModal(false)}
        show={showGrantModal}
        title="Grant Role"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <p className="text-green-800 text-sm">
              <strong>Note:</strong> Granting a role will give the specified
              address administrative access to the selected contract.
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
              <option value="">Select a role...</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={() => setShowGrantModal(false)} outline>
              Cancel
            </Button>
            <Button
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={handleRoleAction}
            >
              {isPending ? "Granting..." : "Grant Role"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Role Modal */}
      <Modal
        onClose={() => setShowRevokeModal(false)}
        show={showRevokeModal}
        title="Revoke Role"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-800 text-sm">
              <strong>Warning:</strong> Revoking a role will remove
              administrative access from the specified address. This action
              cannot be undone.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="revoke-role-select"
            >
              Select Role
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              id="revoke-role-select"
              onChange={(e) => setSelectedRole(e.target.value)}
              value={selectedRole}
            >
              <option value="">Select a role...</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="revoke-target-address"
            >
              Target Address
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              id="revoke-target-address"
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              type="text"
              value={targetAddress}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={() => setShowRevokeModal(false)} outline>
              Cancel
            </Button>
            <Button
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={handleRoleAction}
            >
              {isPending ? "Revoking..." : "Revoke Role"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Renounce Role Modal */}
      <Modal
        onClose={() => setShowRenounceModal(false)}
        show={showRenounceModal}
        title="Renounce Role"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
            <p className="text-orange-800 text-sm">
              <strong>Warning:</strong> Renouncing a role will permanently
              remove the role from the specified address. This action cannot be
              undone and the role cannot be regained without being granted
              again.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="renounce-role-select"
            >
              Select Role
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              id="renounce-role-select"
              onChange={(e) => setSelectedRole(e.target.value)}
              value={selectedRole}
            >
              <option value="">Select a role...</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="renounce-target-address"
            >
              Target Address
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              id="renounce-target-address"
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              type="text"
              value={targetAddress}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={() => setShowRenounceModal(false)} outline>
              Cancel
            </Button>
            <Button
              disabled={isPending || !targetAddress || !selectedRole}
              onClick={handleRoleAction}
            >
              {isPending ? "Renouncing..." : "Renounce Role"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccessControlManager;
