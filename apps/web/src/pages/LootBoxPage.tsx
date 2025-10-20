import { ClockIcon, GiftIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import LootBoxHistory from "../components/LootBox/LootBoxHistory";
import LootBoxHub from "../components/LootBox/LootBoxHub";

const LootBoxPage = () => {
  const [activeTab, setActiveTab] = useState<"hub" | "history">("hub");

  const tabs = [
    { icon: GiftIcon, key: "hub", label: "Loot Boxes" },
    { icon: ClockIcon, key: "history", label: "History" }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Navigation */}
      <div className="border-[#2A2A2A] border-b bg-[#121212]">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
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
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "hub" && <LootBoxHub />}
        {activeTab === "history" && <LootBoxHistory />}
      </div>
    </div>
  );
};

export default LootBoxPage;
