import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import Button from "../Shared/UI/Button";
import Card from "../Shared/UI/Card";
import Input from "../Shared/UI/Input";
import Label from "../Shared/UI/Label";

interface WithdrawalUser {
  walletaddress: string;
  total_withdraw_usdt: number;
  total_withdraw_usd: number;
  tx_count: number;
  tx_unique: number;
}

interface WithdrawalSummary {
  from_field: Array<{ value: string; tx_count: number; total_usdt: number }>;
  to_field: Array<{ value: string; tx_count: number; total_usdt: number }>;
}

interface D3Node {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  totalEq: number;
  leftNode: number;
  rightNode: number;
}

const AdminEndpoints = () => {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalUser[]>([]);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [d3Nodes, setD3Nodes] = useState<D3Node[]>([]);
  const [filters, setFilters] = useState({
    include_all: false,
    limit: 50,
    max_tx: "",
    max_usdt: "",
    min_tx: "",
    min_usdt: "",
    page: 1,
    sort_by: "amount",
    sort_dir: "desc",
    wallet: ""
  });

  const handleDeductCoins = async () => {
    const walletAddress = prompt("Enter wallet address:");
    const amount = prompt("Enter amount to deduct:");

    if (!walletAddress || !amount) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/deduct-user-coins`,
        {
          body: JSON.stringify({
            amount: Number.parseFloat(amount),
            walletaddress: walletAddress
          }),
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Successfully deducted ${result.amount_deducted} coins from ${result.walletaddress}`
        );
      } else {
        toast.error(result.message || "Failed to deduct coins");
      }
    } catch (error) {
      toast.error("Error deducting coins");
    } finally {
      setLoading(false);
    }
  };

  const handleListWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/list-user-withdrawals?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setWithdrawals(result.users || []);
        toast.success(`Found ${result.total_users} users`);
      } else {
        toast.error(result.message || "Failed to fetch withdrawals");
      }
    } catch (error) {
      toast.error("Error fetching withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/list-user-withdrawals-csv?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `withdrawals_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("CSV downloaded successfully");
      } else {
        toast.error("Failed to download CSV");
      }
    } catch (error) {
      toast.error("Error downloading CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/withdraw-category-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSummary(result);
        toast.success("Summary loaded successfully");
      } else {
        toast.error(result.message || "Failed to fetch summary");
      }
    } catch (error) {
      toast.error("Error fetching summary");
    } finally {
      setLoading(false);
    }
  };

  const handleD3Nodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || "http://localhost:8080"}/admin/d3-nodes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setD3Nodes(result.nodes || []);
        toast.success(
          `Loaded ${result.nodes?.length || 0} nodes for D3 visualization`
        );
      } else {
        toast.error(result.message || "Failed to fetch D3 nodes");
      }
    } catch (error) {
      toast.error("Error fetching D3 nodes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-2 font-bold text-2xl text-white">Admin Endpoints</h2>
        <p className="text-gray-400">
          مدیریت endpoint های پروژه قبلی - کسر سکه، لیست برداشت‌ها، و گزارش‌گیری
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg text-white">عملیات سریع</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button
            className="flex items-center gap-2"
            disabled={loading}
            onClick={handleDeductCoins}
          >
            <CurrencyDollarIcon className="h-5 w-5" />
            کسر سکه از کاربر
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={loading}
            onClick={handleListWithdrawals}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            لیست برداشت‌ها
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={loading}
            onClick={handleWithdrawalSummary}
          >
            <ChartBarIcon className="h-5 w-5" />
            خلاصه دسته‌بندی
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={loading}
            onClick={handleD3Nodes}
          >
            <UserGroupIcon className="h-5 w-5" />
            داده‌های D3
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg text-white">
          فیلترهای جستجو
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="wallet">آدرس کیف پول</Label>
            <Input
              id="wallet"
              onChange={(e) =>
                setFilters({ ...filters, wallet: e.target.value })
              }
              placeholder="0x..."
              value={filters.wallet}
            />
          </div>

          <div>
            <Label htmlFor="min_usdt">حداقل USDT</Label>
            <Input
              id="min_usdt"
              onChange={(e) =>
                setFilters({ ...filters, min_usdt: e.target.value })
              }
              placeholder="0"
              type="number"
              value={filters.min_usdt}
            />
          </div>

          <div>
            <Label htmlFor="max_usdt">حداکثر USDT</Label>
            <Input
              id="max_usdt"
              onChange={(e) =>
                setFilters({ ...filters, max_usdt: e.target.value })
              }
              placeholder="1000"
              type="number"
              value={filters.max_usdt}
            />
          </div>

          <div>
            <Label htmlFor="sort_by" id="sort_by_label">
              مرتب‌سازی بر اساس
            </Label>
            <select
              aria-labelledby="sort_by_label"
              className="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              id="sort_by"
              onChange={(e) =>
                setFilters({ ...filters, sort_by: e.target.value })
              }
              title="مرتب‌سازی بر اساس"
              value={filters.sort_by}
            >
              <option value="amount">مبلغ</option>
              <option value="tx">تعداد تراکنش</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button disabled={loading} onClick={handleListWithdrawals}>
            جستجو
          </Button>
          <Button
            disabled={loading}
            onClick={handleDownloadCSV}
            variant="outline"
          >
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
            دانلود CSV
          </Button>
        </div>
      </Card>

      {/* Withdrawals Table */}
      {withdrawals.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            نتایج برداشت‌ها
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-gray-600 border-b">
                  <th className="px-4 py-3 text-left text-gray-300">
                    آدرس کیف پول
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    مجموع USDT
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    مجموع USD
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    تعداد تراکنش
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    تراکنش‌های منحصر
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((user, index) => (
                  <tr
                    className="border-gray-700 border-b hover:bg-gray-800"
                    key={index}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-white">
                      {user.walletaddress}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {user.total_withdraw_usdt.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      ${user.total_withdraw_usd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-white">{user.tx_count}</td>
                    <td className="px-4 py-3 text-white">{user.tx_unique}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            خلاصه دسته‌بندی برداشت‌ها
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium text-white">From Field</h4>
              <div className="space-y-2">
                {summary.from_field.map((item, index) => (
                  <div className="flex justify-between text-sm" key={index}>
                    <span className="text-gray-300">{item.value}</span>
                    <span className="text-white">
                      {item.tx_count} tx - ${item.total_usdt.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-white">To Field</h4>
              <div className="space-y-2">
                {summary.to_field.map((item, index) => (
                  <div className="flex justify-between text-sm" key={index}>
                    <span className="text-gray-300">{item.value}</span>
                    <span className="text-white">
                      {item.tx_count} tx - ${item.total_usdt.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* D3 Nodes */}
      {d3Nodes.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            داده‌های D3 Visualization
          </h3>
          <p className="mb-4 text-gray-400">
            {d3Nodes.length} node برای نمودار D3.js آماده شده است
          </p>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-gray-600 border-b">
                  <th className="px-4 py-3 text-left text-gray-300">ID</th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    آدرس کیف پول
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    نام کاربری
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    Total EQ
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    Left Node
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">
                    Right Node
                  </th>
                </tr>
              </thead>
              <tbody>
                {d3Nodes.slice(0, 20).map((node, index) => (
                  <tr
                    className="border-gray-700 border-b hover:bg-gray-800"
                    key={index}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-white">
                      {node.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white">
                      {node.walletAddress}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {node.username || node.displayName || "-"}
                    </td>
                    <td className="px-4 py-3 text-white">{node.totalEq}</td>
                    <td className="px-4 py-3 text-white">{node.leftNode}</td>
                    <td className="px-4 py-3 text-white">{node.rightNode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminEndpoints;
