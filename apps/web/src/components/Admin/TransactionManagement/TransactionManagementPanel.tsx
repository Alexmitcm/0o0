import { Button } from "@headlessui/react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import Card from "../../Shared/UI/Card";

interface Transaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress: string;
  blockNumber: number;
  createdAt: string;
  type: "blockchain" | "coin";
}

interface TransactionStats {
  totalTransactions: number;
  blockchainTransactions: number;
  coinTransactions: number;
  totalVolume: string;
  todayTransactions: number;
}

const TransactionManagementPanel = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Generate unique IDs for form elements
  const searchInputId = useId();
  const typeFilterId = useId();
  const transactionHashId = useId();
  const fromAddressId = useId();
  const toAddressId = useId();
  const amountId = useId();
  const blockNumberId = useId();

  // Fetch transactions and stats
  const fetchData = async () => {
    try {
      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

      // Fetch blockchain transactions
      const blockchainResponse = await fetch(`${baseApi}/transactions`, {
        headers: { "Content-Type": "application/json" }
      });

      if (blockchainResponse.ok) {
        const blockchainData = await blockchainResponse.json();
        const blockchainTxs = (blockchainData.data || []).map((tx: any) => ({
          amount: tx.amount?.toString() || "0",
          blockNumber: tx.blockNumber,
          createdAt: tx.createdAt,
          fromAddress: tx.fromAddress,
          hash: tx.txHash,
          id: tx.id,
          toAddress: tx.toAddress,
          tokenAddress: tx.tokenAddress,
          type: "blockchain" as const
        }));

        setTransactions(blockchainTxs);
      }

      // Mock stats for now
      const mockStats: TransactionStats = {
        blockchainTransactions: 800,
        coinTransactions: 450,
        todayTransactions: 45,
        totalTransactions: 1250,
        totalVolume: "1,250,000"
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || tx.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "blockchain":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "coin":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <div>
          <h2 className="font-semibold text-2xl text-gray-900 dark:text-white">
            Transaction Management
          </h2>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Monitor blockchain and coin transactions
          </p>
        </div>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={fetchData}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Total Transactions
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.totalTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <div className="h-4 w-4 rounded-full bg-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Blockchain
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.blockchainTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <div className="h-4 w-4 rounded-full bg-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Coin Transactions
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.coinTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Total Volume
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.totalVolume}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  aria-label="Search transactions"
                  className="rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  id={searchInputId}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by hash or address..."
                  type="text"
                  value={searchTerm}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <select
                aria-label="Filter by type"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                id={typeFilterId}
                onChange={(e) => setSelectedType(e.target.value)}
                value={selectedType}
              >
                <option value="all">All Types</option>
                <option value="blockchain">Blockchain</option>
                <option value="coin">Coin</option>
              </select>
            </div>

            <div className="text-gray-600 text-sm dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Hash
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  From
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  To
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Block
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {filteredTransactions.map((transaction) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  key={transaction.id}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 text-sm dark:text-white">
                    {formatAddress(transaction.hash)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 text-sm dark:text-white">
                    {formatAddress(transaction.fromAddress)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 text-sm dark:text-white">
                    {formatAddress(transaction.toAddress)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-white">
                    {Number.parseFloat(transaction.amount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getTypeColor(transaction.type)}`}
                    >
                      {transaction.type.charAt(0).toUpperCase() +
                        transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-white">
                    {transaction.blockNumber.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Button
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  Transaction Details
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSelectedTransaction(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={transactionHashId}
                  >
                    Transaction Hash
                  </label>
                  <p
                    className="mt-1 font-mono text-gray-900 text-sm dark:text-white"
                    id={transactionHashId}
                  >
                    {selectedTransaction.hash}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={fromAddressId}
                    >
                      From Address
                    </label>
                    <p
                      className="mt-1 font-mono text-gray-900 text-sm dark:text-white"
                      id={fromAddressId}
                    >
                      {selectedTransaction.fromAddress}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={toAddressId}
                    >
                      To Address
                    </label>
                    <p
                      className="mt-1 font-mono text-gray-900 text-sm dark:text-white"
                      id={toAddressId}
                    >
                      {selectedTransaction.toAddress}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={amountId}
                    >
                      Amount
                    </label>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={amountId}
                    >
                      {Number.parseFloat(
                        selectedTransaction.amount
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={blockNumberId}
                    >
                      Block Number
                    </label>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={blockNumberId}
                    >
                      {selectedTransaction.blockNumber.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Type
                  </div>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getTypeColor(selectedTransaction.type)}`}
                  >
                    {selectedTransaction.type.charAt(0).toUpperCase() +
                      selectedTransaction.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionManagementPanel;
