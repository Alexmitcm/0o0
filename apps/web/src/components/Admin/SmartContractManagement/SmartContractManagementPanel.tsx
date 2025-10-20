import { Button } from "@headlessui/react";
import {
  BanknotesIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CogIcon,
  EyeIcon,
  PlayIcon,
  ShieldCheckIcon,
  StopIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Card from "../../Shared/UI/Card";

interface Contract {
  id: string;
  name: string;
  address: string;
  type: string;
  status: "active" | "inactive" | "paused";
  balance: string;
  lastInteraction: string;
  gasUsed: number;
  transactionCount: number;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  totalBalance: string;
  totalGasUsed: number;
  totalTransactions: number;
}

const SmartContractManagementPanel = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch contracts and stats
  const fetchData = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      // Fetch contracts
      const contractsResponse = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/contracts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json();
        setContracts(contractsData.contracts || []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/contract-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching contract data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle contract actions
  const handleContractAction = async (contractId: string, action: string) => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/contracts/${contractId}/${action}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error ${action} contract:`, error);
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Get contract icon
  const getContractIcon = (type: string) => {
    switch (type) {
      case "referral":
        return UserGroupIcon;
      case "game_vault":
        return BanknotesIcon;
      case "main_node":
        return CogIcon;
      case "dev_vault":
        return CodeBracketIcon;
      case "access_control":
        return ShieldCheckIcon;
      default:
        return CodeBracketIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          Smart Contract Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => fetchData()}
        >
          <ChartBarIcon className="h-5 w-5" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CodeBracketIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalContracts}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Contracts
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <PlayIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.activeContracts}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Active Contracts
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <BanknotesIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalBalance} ETH
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Balance
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalTransactions.toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Transactions
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2">
            {[
              { id: "overview", name: "Overview" },
              { id: "referral", name: "Referral Contract" },
              { id: "game_vault", name: "Game Vault" },
              { id: "main_node", name: "Main Node" },
              { id: "dev_vault", name: "Dev Vault" },
              { id: "access_control", name: "Access Control" }
            ].map((tab) => (
              <Button
                className={`rounded-lg px-4 py-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Contracts List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Contract
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Balance
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Last Interaction
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {contracts.map((contract) => {
                const Icon = getContractIcon(contract.type);
                return (
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    key={contract.id}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Icon className="h-6 w-6 text-gray-400" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 text-sm dark:text-white">
                            {contract.name}
                          </div>
                          <div className="font-mono text-gray-500 text-xs dark:text-gray-400">
                            {contract.address.slice(0, 10)}...
                            {contract.address.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">
                        {contract.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(contract.status)}`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                      {contract.balance} ETH
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                      {contract.transactionCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                      {new Date(contract.lastInteraction).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-sm">
                      <div className="flex gap-2">
                        <Button
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => setSelectedContract(contract)}
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>

                        <Button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          onClick={() =>
                            handleContractAction(
                              contract.id,
                              contract.status === "active"
                                ? "pause"
                                : "activate"
                            )
                          }
                          title={
                            contract.status === "active"
                              ? "Pause Contract"
                              : "Activate Contract"
                          }
                        >
                          {contract.status === "active" ? (
                            <StopIcon className="h-4 w-4" />
                          ) : (
                            <PlayIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {selectedContract.name}
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSelectedContract(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Contract Address
                    </div>
                    <p className="font-mono text-gray-900 text-sm dark:text-white">
                      {selectedContract.address}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Type
                    </div>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedContract.type.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Status
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(selectedContract.status)}`}
                    >
                      {selectedContract.status}
                    </span>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Balance
                    </div>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedContract.balance} ETH
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Transactions
                    </div>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedContract.transactionCount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Gas Used
                    </div>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedContract.gasUsed.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Last Interaction
                  </div>
                  <p className="text-gray-900 text-sm dark:text-white">
                    {new Date(
                      selectedContract.lastInteraction
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SmartContractManagementPanel;
