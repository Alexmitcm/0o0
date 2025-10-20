import {
  BanknotesIcon,
  ChartBarIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { arbitrum } from "wagmi/chains";
import AccessControlManager from "./AccessControlManager";
import DataMonitor from "./DataMonitor";
import DevVaultContractManager from "./DevVaultContractManager";
import GameVaultContractManager from "./GameVaultContractManager";
import MainNodeContractManager from "./MainNodeContractManager";
import ReferralContractManager from "./ReferralContractManager";
import WalletConnection from "./WalletConnection";

enum AdminTab {
  REFERRAL = "REFERRAL",
  GAME_VAULT = "GAME_VAULT",
  MAIN_NODE = "MAIN_NODE",
  DEV_VAULT = "DEV_VAULT",
  ACCESS_CONTROL = "ACCESS_CONTROL",
  DATA_MONITOR = "DATA_MONITOR"
}

const SmartContractControlPanel = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.REFERRAL);

  const isCorrectNetwork = chainId === arbitrum.id;

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-3xl text-gray-900">
                  Smart Contract Control Panel
                </h1>
                <p className="text-gray-600">
                  Professional admin interface for managing blockchain contracts
                </p>
              </div>
            </div>
          </div>
          <WalletConnection />
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-3xl text-gray-900">
                  Smart Contract Control Panel
                </h1>
                <p className="text-gray-600">
                  Professional admin interface for managing blockchain contracts
                </p>
              </div>
            </div>
          </div>
          <WalletConnection />
        </div>
      </div>
    );
  }

  const tabs = [
    {
      description: "Manage referral fees, rewards, and vault distribution",
      icon: UserGroupIcon,
      id: AdminTab.REFERRAL,
      name: "Referral Contract"
    },
    {
      description: "Handle batch reward distribution and player balances",
      icon: BanknotesIcon,
      id: AdminTab.GAME_VAULT,
      name: "Game Vault Contract"
    },
    {
      description: "Manage main node rewards and system configuration",
      icon: ServerIcon,
      id: AdminTab.MAIN_NODE,
      name: "Main Node Controls"
    },
    {
      description: "Manage developer vault and fund withdrawals",
      icon: CodeBracketIcon,
      id: AdminTab.DEV_VAULT,
      name: "Developer Vault"
    },
    {
      description: "Manage roles and permissions for all contracts",
      icon: ShieldCheckIcon,
      id: AdminTab.ACCESS_CONTROL,
      name: "Access Control"
    },
    {
      description: "View on-chain data and player information",
      icon: ChartBarIcon,
      id: AdminTab.DATA_MONITOR,
      name: "Data Monitor"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case AdminTab.REFERRAL:
        return <ReferralContractManager />;
      case AdminTab.GAME_VAULT:
        return <GameVaultContractManager />;
      case AdminTab.MAIN_NODE:
        return <MainNodeContractManager />;
      case AdminTab.DEV_VAULT:
        return <DevVaultContractManager />;
      case AdminTab.ACCESS_CONTROL:
        return <AccessControlManager />;
      case AdminTab.DATA_MONITOR:
        return <DataMonitor />;
      default:
        return <ReferralContractManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-3xl text-gray-900">
                  Smart Contract Control Panel
                </h1>
                <p className="text-gray-600">
                  Professional admin interface for managing blockchain contracts
                </p>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-gray-900 text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <p className="font-medium text-green-600 text-xs">
                  Connected to Arbitrum One
                </p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 text-gray-500 text-sm">
            <span>Connected as:</span>
            <code className="rounded bg-gray-100 px-2 py-1 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </code>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav aria-label="Tabs" className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  className={`group relative rounded-lg px-3 py-2 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "border border-blue-200 bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  } `}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                  {isActive && (
                    <div className="-bottom-px absolute inset-x-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SmartContractControlPanel;
