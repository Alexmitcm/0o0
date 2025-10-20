import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { fa } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  History,
  Search
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Skeleton
} from "@/components/Shared/UI";
import { Badge } from "@/components/Shared/UI/Badge";
import { Button } from "@/components/Shared/UI/Button";
import { Input } from "@/components/Shared/UI/Input";

interface TransactionHistoryProps {
  walletAddress: string;
  onWithdrawClick?: () => void;
}

interface Transaction {
  id: string;
  walletAddress: string;
  coinType: string;
  amount: number;
  transactionType: "Earned" | "Spent" | "Transferred" | "Received";
  sourceType: string;
  sourceId?: string;
  sourceMetadata?: any;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface TransactionResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchTransactions = async (
  walletAddress: string,
  page = 1,
  limit = 20,
  transactionType?: string,
  coinType?: string,
  search?: string
): Promise<TransactionResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString()
  });

  if (transactionType) params.append("transactionType", transactionType);
  if (coinType) params.append("coinType", coinType);
  if (search) params.append("search", search);

  const response = await fetch(
    `/api/transaction-system?walletaddress=${walletAddress}&${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  walletAddress,
  onWithdrawClick
}) => {
  const [page, setPage] = useState(1);
  const [transactionType, setTransactionType] = useState<string>("");
  const [coinType, setCoinType] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryFn: () =>
      fetchTransactions(
        walletAddress,
        page,
        20,
        transactionType,
        coinType,
        search
      ),
    queryKey: [
      "transactions",
      walletAddress,
      page,
      transactionType,
      coinType,
      search
    ],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Earned":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "Spent":
        return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
      case "Transferred":
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case "Received":
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "Earned":
        return "text-green-600 bg-green-100";
      case "Spent":
        return "text-red-600 bg-red-100";
      case "Transferred":
        return "text-blue-600 bg-blue-100";
      case "Received":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "Earned":
        return "Earned";
      case "Spent":
        return "Spent";
      case "Transferred":
        return "Transferred";
      case "Received":
        return "Received";
      default:
        return type;
    }
  };

  const getCoinTypeColor = (type: string) => {
    switch (type) {
      case "Experience":
        return "bg-green-500";
      case "Achievement":
        return "bg-yellow-500";
      case "Social":
        return "bg-purple-500";
      case "Premium":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCoinTypeLabel = (type: string) => {
    switch (type) {
      case "Experience":
        return "Experience";
      case "Achievement":
        return "Achievement";
      case "Social":
        return "Social";
      case "Premium":
        return "Premium";
      default:
        return type;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "GamePlay":
        return "Game";
      case "Tournament":
        return "Tournament";
      case "Transfer":
        return "Transfer";
      case "Withdrawal":
        return "Withdrawal";
      case "Admin":
        return "Admin";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              className="flex items-center space-x-4 rounded-lg border p-4"
              key={i}
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading transaction history</p>
            <Button
              className="mt-2"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          {onWithdrawClick && (
            <Button onClick={onWithdrawClick} size="sm">
              Withdraw Coins
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="min-w-64 flex-1">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 transform text-gray-400" />
              <Input
                className="pr-10"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                value={search}
              />
            </div>
          </div>

          <Select
            onValueChange={setTransactionType}
            options={[
              { label: "All Types", value: "" },
              { label: "Earned", value: "Earned" },
              { label: "Spent", value: "Spent" },
              { label: "Transferred", value: "Transferred" },
              { label: "Received", value: "Received" }
            ]}
            value={transactionType}
          />

          <Select
            onValueChange={setCoinType}
            options={[
              { label: "All Types", value: "" },
              { label: "Experience", value: "Experience" },
              { label: "Achievement", value: "Achievement" },
              { label: "Social", value: "Social" },
              { label: "Premium", value: "Premium" }
            ]}
            value={coinType}
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {data.transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <History className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            data.transactions.map((transaction) => (
              <div
                className="flex items-center space-x-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
                key={transaction.id}
              >
                <div className="flex-shrink-0">
                  {getTransactionIcon(transaction.transactionType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      className={getTransactionColor(
                        transaction.transactionType
                      )}
                    >
                      {getTransactionLabel(transaction.transactionType)}
                    </Badge>
                    <Badge
                      className={`text-white ${getCoinTypeColor(transaction.coinType)}`}
                    >
                      {getCoinTypeLabel(transaction.coinType)}
                    </Badge>
                    <Badge variant="outline">
                      {getSourceTypeLabel(transaction.sourceType)}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    {transaction.description}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(transaction.createdAt), {
                      addSuffix: true
                    })}
                  </p>
                  {transaction.sourceId && (
                    <p className="text-gray-400 text-xs">
                      ID: {transaction.sourceId}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-lg ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Balance: {transaction.balanceAfter.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-gray-600 text-sm">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
