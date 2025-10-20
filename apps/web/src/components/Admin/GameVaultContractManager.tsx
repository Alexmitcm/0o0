import {
  BanknotesIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import gameVaultAbi from "../../abi/gameVault.json";
import { Button, Card, CardHeader, Modal } from "../Shared/UI";
import { CONTRACT_ADDRESSES } from "../../lib/contracts";

// Contract addresses
const GAME_VAULT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.GAME_VAULT;

interface PlayerReward {
  player: string;
  balance: string;
}

const GameVaultContractManager = () => {
  const [showBatchRewardModal, setShowBatchRewardModal] = useState(false);
  const [showBatchClaimModal, setShowBatchClaimModal] = useState(false);
  const [_showConfirmationModal, _setShowConfirmationModal] = useState(false);
  const [_pendingAction, _setPendingAction] = useState<string>("");
  const [playerRewards, setPlayerRewards] = useState<PlayerReward[]>([]);
  const [batchClaimAddresses, setBatchClaimAddresses] = useState<string[]>([]);
  const [newPlayerAddress, setNewPlayerAddress] = useState("");
  const [newPlayerBalance, setNewPlayerBalance] = useState("");

  const { writeContract, isPending } = useWriteContract();

  const addPlayerReward = () => {
    if (!newPlayerAddress || !newPlayerBalance) {
      toast.error("Please enter both player address and balance");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newPlayerAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setPlayerRewards((prev) => [
      ...prev,
      {
        balance: newPlayerBalance,
        player: newPlayerAddress
      }
    ]);
    setNewPlayerAddress("");
    setNewPlayerBalance("");
  };

  const removePlayerReward = (index: number) => {
    setPlayerRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchRewardSubmit = () => {
    if (playerRewards.length === 0) {
      toast.error("Please add at least one player reward");
      return;
    }

    const playerInfoArray = playerRewards.map((reward) => ({
      balance: BigInt(reward.balance),
      player: reward.player as `0x${string}`
    }));

    writeContract({
      abi: gameVaultAbi,
      address: GAME_VAULT_CONTRACT_ADDRESS as `0x${string}`,
      args: [playerInfoArray],
      functionName: "playersReward"
    });

    toast.success("Batch reward distribution submitted successfully");
    setShowBatchRewardModal(false);
    setPlayerRewards([]);
  };

  const handleBatchClaimSubmit = () => {
    if (batchClaimAddresses.length === 0) {
      toast.error("Please add at least one address to claim for");
      return;
    }

    const addressArray = batchClaimAddresses.map(
      (addr) => addr as `0x${string}`
    );

    writeContract({
      abi: gameVaultAbi,
      address: GAME_VAULT_CONTRACT_ADDRESS as `0x${string}`,
      args: [addressArray],
      functionName: "claimRewardAdminList"
    });

    toast.success("Batch claim submitted successfully");
    setShowBatchClaimModal(false);
    setBatchClaimAddresses([]);
  };

  const addClaimAddress = () => {
    if (!newPlayerAddress) {
      toast.error("Please enter a player address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newPlayerAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setBatchClaimAddresses((prev) => [...prev, newPlayerAddress]);
    setNewPlayerAddress("");
  };

  const removeClaimAddress = (index: number) => {
    setBatchClaimAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const sections = [
    {
      action: () => setShowBatchRewardModal(true),
      actionText: "Distribute Rewards",
      color: "blue",
      description: "Distribute rewards to multiple players at once",
      icon: BanknotesIcon,
      title: "Batch Reward Distribution"
    },
    {
      action: () => setShowBatchClaimModal(true),
      actionText: "Batch Claim",
      color: "green",
      description: "Claim rewards on behalf of multiple players",
      icon: PlayIcon,
      title: "Batch Claim Rewards"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center space-x-3">
        <BanknotesIcon className="h-6 w-6 text-green-600" />
        <h2 className="font-bold text-2xl text-gray-900">
          Game Vault Contract Management
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const colorClasses = {
            blue: "border-blue-200 bg-blue-50",
            green: "border-green-200 bg-green-50"
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

      {/* Batch Reward Distribution Modal */}
      <Modal
        onClose={() => setShowBatchRewardModal(false)}
        show={showBatchRewardModal}
        title="Batch Reward Distribution"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This will distribute rewards to all listed
              players. Make sure all addresses and amounts are correct before
              proceeding.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="player-address"
              >
                Player Address
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                id="player-address"
                onChange={(e) => setNewPlayerAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={newPlayerAddress}
              />
            </div>
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="player-balance"
              >
                Balance (wei)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                id="player-balance"
                onChange={(e) => setNewPlayerBalance(e.target.value)}
                placeholder="Enter amount in wei"
                type="number"
                value={newPlayerBalance}
              />
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!newPlayerAddress || !newPlayerBalance}
            onClick={addPlayerReward}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Player Reward
          </Button>

          {playerRewards.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Players to Reward:</h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {playerRewards.map((reward, index) => (
                  <div
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                    key={index}
                  >
                    <div className="flex-1">
                      <p className="font-mono text-gray-900 text-sm">
                        {reward.player}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {reward.balance} wei
                      </p>
                    </div>
                    <Button
                      onClick={() => removePlayerReward(index)}
                      size="sm"
                      variant="outline"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowBatchRewardModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || playerRewards.length === 0}
              onClick={handleBatchRewardSubmit}
            >
              {isPending ? "Distributing..." : "Distribute Rewards"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Claim Modal */}
      <Modal
        onClose={() => setShowBatchClaimModal(false)}
        show={showBatchClaimModal}
        title="Batch Claim Rewards"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This will claim rewards on behalf of all
              listed players. Make sure all addresses are correct before
              proceeding.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="claim-address"
            >
              Player Address
            </label>
            <div className="flex space-x-2">
              <input
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                id="claim-address"
                onChange={(e) => setNewPlayerAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={newPlayerAddress}
              />
              <Button disabled={!newPlayerAddress} onClick={addClaimAddress}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {batchClaimAddresses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">
                Addresses to Claim For:
              </h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {batchClaimAddresses.map((address, index) => (
                  <div
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                    key={index}
                  >
                    <p className="font-mono text-gray-900 text-sm">{address}</p>
                    <Button
                      onClick={() => removeClaimAddress(index)}
                      size="sm"
                      variant="outline"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowBatchClaimModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || batchClaimAddresses.length === 0}
              onClick={handleBatchClaimSubmit}
            >
              {isPending ? "Claiming..." : "Claim Rewards"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GameVaultContractManager;
