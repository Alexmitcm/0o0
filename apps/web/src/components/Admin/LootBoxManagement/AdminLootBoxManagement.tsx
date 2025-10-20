import {
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  GiftIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface AdminLootBoxManagementProps {
  className?: string;
}

interface LootBox {
  id: string;
  name: string;
  description?: string;
  type: "Free" | "Premium";
  isActive: boolean;
  cooldownMinutes: number;
  maxOpensPerDay?: number;
  adRequired: boolean;
  adProvider?: string;
  adPlacementId?: string;
  requiresPremium: boolean;
  minCoinReward: number;
  maxCoinReward: number;
  coinType: "Experience" | "Achievement" | "Social" | "Premium";
  rewards: LootBoxReward[];
  createdAt: string;
  updatedAt: string;
}

interface LootBoxReward {
  id: string;
  rewardType: "Coins" | "NFT" | "Crypto" | "Experience" | "Achievement";
  rewardValue: string;
  probability: number;
  isActive: boolean;
}

const AdminLootBoxManagement = ({
  className = ""
}: AdminLootBoxManagementProps) => {
  const [activeTab, setActiveTab] = useState<"lootboxes" | "rewards" | "stats">(
    "lootboxes"
  );
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingLootBox, setEditingLootBox] = useState<LootBox | null>(null);

  const queryClient = useQueryClient();

  // Fetch loot boxes
  const { data: lootBoxes, isLoading: lootBoxesLoading } = useQuery({
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/lootbox");
      if (!response.ok) throw new Error("Failed to fetch loot boxes");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["adminLootBoxes"]
  });

  // Create loot box mutation
  const createLootBoxMutation = useMutation({
    mutationFn: async (data: Partial<LootBox>) => {
      const response = await fetch("http://localhost:8080/lootbox/admin", {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to create loot box");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLootBoxes"] });
      setShowCreateModal(false);
    }
  });

  // Update loot box mutation
  const updateLootBoxMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<LootBox>;
    }) => {
      const response = await fetch(`http://localhost:8080/lootbox/admin/${id}`, {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      });
      if (!response.ok) throw new Error("Failed to update loot box");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLootBoxes"] });
      setShowEditModal(false);
      setEditingLootBox(null);
    }
  });

  // Delete loot box mutation
  const deleteLootBoxMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`http://localhost:8080/lootbox/admin/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete loot box");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLootBoxes"] });
    }
  });

  // Add reward mutation
  const addRewardMutation = useMutation({
    mutationFn: async ({
      lootBoxId,
      rewardData
    }: {
      lootBoxId: string;
      rewardData: any;
    }) => {
      const response = await fetch(`http://localhost:8080/lootbox/admin/${lootBoxId}/rewards`, {
        body: JSON.stringify(rewardData),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to add reward");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLootBoxes"] });
      setShowRewardModal(false);
    }
  });

  const handleCreateLootBox = (data: Partial<LootBox>) => {
    createLootBoxMutation.mutate(data);
  };

  const handleUpdateLootBox = (id: string, data: Partial<LootBox>) => {
    updateLootBoxMutation.mutate({ data, id });
  };

  const handleDeleteLootBox = (id: string) => {
    if (confirm("Are you sure you want to delete this loot box?")) {
      deleteLootBoxMutation.mutate(id);
    }
  };

  const handleAddReward = (lootBoxId: string, rewardData: any) => {
    addRewardMutation.mutate({ lootBoxId, rewardData });
  };

  const getLootBoxTypeIcon = (type: string) => {
    switch (type) {
      case "Free":
        return <GiftIcon className="h-5 w-5 text-green-400" />;
      case "Premium":
        return <SparklesIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <GiftIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "Coins":
        return <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />;
      case "NFT":
        return <CubeIcon className="h-4 w-4 text-blue-400" />;
      case "Crypto":
        return <CurrencyDollarIcon className="h-4 w-4 text-green-400" />;
      case "Experience":
        return <TrophyIcon className="h-4 w-4 text-blue-400" />;
      case "Achievement":
        return <TrophyIcon className="h-4 w-4 text-yellow-400" />;
      default:
        return <GiftIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const tabs = [
    { icon: GiftIcon, key: "lootboxes", label: "Loot Boxes" },
    { icon: CubeIcon, key: "rewards", label: "Rewards" },
    { icon: TrophyIcon, key: "stats", label: "Statistics" }
  ];

  return (
    <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <GiftIcon className="h-6 w-6 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">
              Loot Box Management
            </h1>
            <p className="text-gray-400">
              Manage loot boxes, rewards, and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {tabs.map((tab) => (
            <button
              className={`flex items-center gap-2 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-[#00FFFF] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "lootboxes" && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-xl">Loot Boxes</h2>
            <button
              className="flex items-center gap-2 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Create Loot Box
            </button>
          </div>

          {/* Loot Boxes List */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            {lootBoxesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div className="flex items-center gap-4" key={i}>
                    <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : lootBoxes && lootBoxes.length > 0 ? (
              <div className="space-y-4">
                {lootBoxes.map((lootBox: LootBox) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                    key={lootBox.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                        {getLootBoxTypeIcon(lootBox.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">
                            {lootBox.name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 font-medium text-xs ${
                              lootBox.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {lootBox.isActive ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 font-medium text-xs ${
                              lootBox.type === "Free"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-purple-500/20 text-purple-400"
                            }`}
                          >
                            {lootBox.type}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {lootBox.description}
                        </p>
                        <div className="flex items-center gap-4 text-gray-500 text-xs">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {lootBox.cooldownMinutes}m cooldown
                          </div>
                          {lootBox.maxOpensPerDay && (
                            <div className="flex items-center gap-1">
                              <GiftIcon className="h-3 w-3" />
                              {lootBox.maxOpensPerDay}/day limit
                            </div>
                          )}
                          {lootBox.adRequired && (
                            <div className="flex items-center gap-1">
                              <EyeIcon className="h-3 w-3" />
                              Ad required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                        onClick={() => {
                          setSelectedLootBox(lootBox);
                          setShowRewardModal(true);
                        }}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                        onClick={() => {
                          setEditingLootBox(lootBox);
                          setShowEditModal(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg bg-red-500/20 p-2 text-red-400 transition-all hover:bg-red-500/30"
                        onClick={() => handleDeleteLootBox(lootBox.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-400">No loot boxes found</p>
                <button
                  className="mt-4 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first loot box
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "rewards" && selectedLootBox && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-xl">
              Rewards for {selectedLootBox.name}
            </h2>
            <button
              className="flex items-center gap-2 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80"
              onClick={() => setShowRewardModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Reward
            </button>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            {selectedLootBox.rewards && selectedLootBox.rewards.length > 0 ? (
              <div className="space-y-4">
                {selectedLootBox.rewards.map((reward) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                    key={reward.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                        {getRewardTypeIcon(reward.rewardType)}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {reward.rewardType}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {JSON.parse(reward.rewardValue).amount || "1"} items
                        </p>
                        <p className="text-gray-500 text-xs">
                          {(reward.probability * 100).toFixed(1)}% chance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 font-medium text-xs ${
                          reward.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {reward.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-400">No rewards configured</p>
                <button
                  className="mt-4 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80"
                  onClick={() => setShowRewardModal(true)}
                >
                  Add your first reward
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">
              Loot Box Statistics
            </h3>
            <p className="text-gray-400">
              View comprehensive loot box usage statistics and analytics.
            </p>
            {/* Stats component would be implemented here */}
          </div>
        </div>
      )}

      {/* Create Loot Box Modal */}
      {showCreateModal && (
        <CreateLootBoxModal
          isLoading={createLootBoxMutation.isPending}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLootBox}
        />
      )}

      {/* Edit Loot Box Modal */}
      {showEditModal && editingLootBox && (
        <EditLootBoxModal
          isLoading={updateLootBoxMutation.isPending}
          lootBox={editingLootBox}
          onClose={() => {
            setShowEditModal(false);
            setEditingLootBox(null);
          }}
          onSubmit={(data: any) => handleUpdateLootBox(editingLootBox.id, data)}
        />
      )}

      {/* Add Reward Modal */}
      {showRewardModal && selectedLootBox && (
        <AddRewardModal
          isLoading={addRewardMutation.isPending}
          lootBoxId={selectedLootBox.id}
          onClose={() => setShowRewardModal(false)}
          onSubmit={handleAddReward}
        />
      )}
    </div>
  );
};

// Create Loot Box Modal Component
const CreateLootBoxModal = ({ onClose, onSubmit, isLoading }: any) => {
  const [formData, setFormData] = useState({
    adPlacementId: "",
    adProvider: "",
    adRequired: false,
    coinType: "Experience" as
      | "Experience"
      | "Achievement"
      | "Social"
      | "Premium",
    cooldownMinutes: 60,
    description: "",
    maxCoinReward: 100,
    maxOpensPerDay: "",
    minCoinReward: 10,
    name: "",
    requiresPremium: false,
    type: "Free" as "Free" | "Premium"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      maxOpensPerDay: formData.maxOpensPerDay
        ? Number.parseInt(formData.maxOpensPerDay)
        : null
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
        <h3 className="mb-4 font-bold text-lg text-white">Create Loot Box</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">Name</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter loot box name"
              required
              value={formData.name}
            />
          </div>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
              placeholder="Enter description"
              rows={3}
              value={formData.description}
            />
          </div>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">Type</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as "Free" | "Premium"
                }))
              }
              value={formData.type}
            >
              <option value="Free">Free (Ad-based)</option>
              <option value="Premium">Premium (NFT/Crypto rewards)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-gray-400 text-sm">
                Cooldown (minutes)
              </label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cooldownMinutes: Number.parseInt(e.target.value)
                  }))
                }
                type="number"
                value={formData.cooldownMinutes}
              />
            </div>
            <div>
              <label className="mb-2 block text-gray-400 text-sm">
                Daily Limit
              </label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxOpensPerDay: e.target.value
                  }))
                }
                placeholder="Unlimited"
                type="number"
                value={formData.maxOpensPerDay}
              />
            </div>
          </div>
          {formData.type === "Free" && (
            <>
              <div className="flex items-center gap-2">
                <input
                  checked={formData.adRequired}
                  className="rounded border-white/10 bg-white/5"
                  id="adRequired"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adRequired: e.target.checked
                    }))
                  }
                  type="checkbox"
                />
                <label className="text-gray-400 text-sm" htmlFor="adRequired">
                  Require ad to open
                </label>
              </div>
              {formData.adRequired && (
                <>
                  <div>
                    <label className="mb-2 block text-gray-400 text-sm">
                      Ad Provider
                    </label>
                    <input
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          adProvider: e.target.value
                        }))
                      }
                      placeholder="google, unity, ironsource"
                      value={formData.adProvider}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-gray-400 text-sm">
                      Ad Placement ID
                    </label>
                    <input
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          adPlacementId: e.target.value
                        }))
                      }
                      placeholder="Enter placement ID"
                      value={formData.adPlacementId}
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-gray-400 text-sm">
                    Min Coins
                  </label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minCoinReward: Number.parseInt(e.target.value)
                      }))
                    }
                    type="number"
                    value={formData.minCoinReward}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-gray-400 text-sm">
                    Max Coins
                  </label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxCoinReward: Number.parseInt(e.target.value)
                      }))
                    }
                    type="number"
                    value={formData.maxCoinReward}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-gray-400 text-sm">
                  Coin Type
                </label>
                <select
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coinType: e.target.value as any
                    }))
                  }
                  value={formData.coinType}
                >
                  <option value="Experience">Experience</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Social">Social</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </>
          )}
          {formData.type === "Premium" && (
            <div className="flex items-center gap-2">
              <input
                checked={formData.requiresPremium}
                className="rounded border-white/10 bg-white/5"
                id="requiresPremium"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiresPremium: e.target.checked
                  }))
                }
                type="checkbox"
              />
              <label
                className="text-gray-400 text-sm"
                htmlFor="requiresPremium"
              >
                Requires premium subscription
              </label>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button
              className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-all hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80 disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Loot Box Modal Component
const EditLootBoxModal = ({ lootBox, onClose, onSubmit, isLoading }: any) => {
  const [formData, setFormData] = useState({
    adPlacementId: lootBox.adPlacementId || "",
    adProvider: lootBox.adProvider || "",
    adRequired: lootBox.adRequired,
    coinType: lootBox.coinType,
    cooldownMinutes: lootBox.cooldownMinutes,
    description: lootBox.description || "",
    isActive: lootBox.isActive,
    maxCoinReward: lootBox.maxCoinReward,
    maxOpensPerDay: lootBox.maxOpensPerDay?.toString() || "",
    minCoinReward: lootBox.minCoinReward,
    name: lootBox.name,
    requiresPremium: lootBox.requiresPremium,
    type: lootBox.type
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      maxOpensPerDay: formData.maxOpensPerDay
        ? Number.parseInt(formData.maxOpensPerDay)
        : null
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
        <h3 className="mb-4 font-bold text-lg text-white">Edit Loot Box</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">Name</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              value={formData.name}
            />
          </div>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
              rows={3}
              value={formData.description}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              checked={formData.isActive}
              className="rounded border-white/10 bg-white/5"
              id="isActive"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              type="checkbox"
            />
            <label className="text-gray-400 text-sm" htmlFor="isActive">
              Active
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-all hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80 disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Reward Modal Component
const AddRewardModal = ({ lootBoxId, onClose, onSubmit, isLoading }: any) => {
  const [formData, setFormData] = useState({
    amount: 1,
    coinType: "Experience" as
      | "Experience"
      | "Achievement"
      | "Social"
      | "Premium",
    cryptoAmount: "",
    cryptoSymbol: "USDT",
    nftId: "",
    probability: 0.1,
    rewardType: "Coins" as
      | "Coins"
      | "NFT"
      | "Crypto"
      | "Experience"
      | "Achievement"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let rewardValue: any = {};

    switch (formData.rewardType) {
      case "Coins":
        rewardValue = {
          amount: formData.amount,
          coinType: formData.coinType,
          type: "coins"
        };
        break;
      case "NFT":
        rewardValue = {
          nftId: formData.nftId,
          type: "nft"
        };
        break;
      case "Crypto":
        rewardValue = {
          amount: formData.cryptoAmount,
          symbol: formData.cryptoSymbol,
          type: "crypto"
        };
        break;
      case "Experience":
        rewardValue = {
          amount: formData.amount,
          type: "experience"
        };
        break;
      case "Achievement":
        rewardValue = {
          amount: formData.amount,
          type: "achievement"
        };
        break;
    }

    onSubmit(lootBoxId, {
      probability: formData.probability,
      rewardType: formData.rewardType,
      rewardValue
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
        <h3 className="mb-4 font-bold text-lg text-white">Add Reward</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-gray-400 text-sm">
              Reward Type
            </label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rewardType: e.target.value as any
                }))
              }
              value={formData.rewardType}
            >
              <option value="Coins">Coins</option>
              <option value="NFT">NFT</option>
              <option value="Crypto">Crypto</option>
              <option value="Experience">Experience</option>
              <option value="Achievement">Achievement</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-gray-400 text-sm">
              Probability (0.0 - 1.0)
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
              max="1"
              min="0"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  probability: Number.parseFloat(e.target.value)
                }))
              }
              step="0.01"
              type="number"
              value={formData.probability}
            />
          </div>

          {formData.rewardType === "Coins" && (
            <>
              <div>
                <label className="mb-2 block text-gray-400 text-sm">
                  Amount
                </label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: Number.parseInt(e.target.value)
                    }))
                  }
                  type="number"
                  value={formData.amount}
                />
              </div>
              <div>
                <label className="mb-2 block text-gray-400 text-sm">
                  Coin Type
                </label>
                <select
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coinType: e.target.value as any
                    }))
                  }
                  value={formData.coinType}
                >
                  <option value="Experience">Experience</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Social">Social</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </>
          )}

          {formData.rewardType === "NFT" && (
            <div>
              <label className="mb-2 block text-gray-400 text-sm">NFT ID</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nftId: e.target.value }))
                }
                placeholder="Enter NFT ID"
                value={formData.nftId}
              />
            </div>
          )}

          {formData.rewardType === "Crypto" && (
            <>
              <div>
                <label className="mb-2 block text-gray-400 text-sm">
                  Amount
                </label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cryptoAmount: e.target.value
                    }))
                  }
                  placeholder="0.01"
                  type="number"
                  value={formData.cryptoAmount}
                />
              </div>
              <div>
                <label className="mb-2 block text-gray-400 text-sm">
                  Symbol
                </label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cryptoSymbol: e.target.value
                    }))
                  }
                  placeholder="USDT"
                  value={formData.cryptoSymbol}
                />
              </div>
            </>
          )}

          {(formData.rewardType === "Experience" ||
            formData.rewardType === "Achievement") && (
            <div>
              <label className="mb-2 block text-gray-400 text-sm">Amount</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: Number.parseInt(e.target.value)
                  }))
                }
                type="number"
                value={formData.amount}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-all hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80 disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Adding..." : "Add Reward"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLootBoxManagement;
