import {
  ChartBarIcon,
  CogIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import Card from "@/components/Shared/UI/Card";
import { Input } from "@/components/Shared/UI/Input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import {
  gameHubApi,
  type TournamentData,
  type WithdrawTransactionData
} from "@/lib/api/gameHubApi";

interface GameHubAdminPanelProps {
  className?: string;
}

const GameHubAdminPanel = ({ className = "" }: GameHubAdminPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawTransactionData[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Login form
  const [loginForm, setLoginForm] = useState({
    password: "",
    username: ""
  });

  useEffect(() => {
    // Check if admin is already authenticated
    const token = localStorage.getItem("admin_token");
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await gameHubApi.adminLogin(
        loginForm.username,
        loginForm.password
      );
      if (response.success) {
        setAuthToken(response.token);
        setIsAuthenticated(true);
        localStorage.setItem("admin_token", response.token);
        await loadData();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("admin_token");
    setTournaments([]);
    setWithdrawals([]);
    setStats(null);
  };

  const loadData = async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel with individual error handling
      const [tournamentsRes, withdrawalsRes, statsRes] = await Promise.allSettled([
        gameHubApi.getAllTournaments(),
        gameHubApi.listUserWithdrawals(),
        gameHubApi.getDashboardStats()
      ]);

      // Handle each result individually
      if (tournamentsRes.status === 'fulfilled' && tournamentsRes.value.success) {
        setTournaments(tournamentsRes.value.data);
      } else if (tournamentsRes.status === 'rejected') {
        console.error('Failed to load tournaments:', tournamentsRes.reason);
      }

      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.success) {
        setWithdrawals(withdrawalsRes.value.data);
      } else if (withdrawalsRes.status === 'rejected') {
        console.error('Failed to load withdrawals:', withdrawalsRes.reason);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data);
      } else if (statsRes.status === 'rejected') {
        console.error('Failed to load stats:', statsRes.reason);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // These functions are available for future use
  // const handleResetPassword = async (walletAddress: string, newPassword: string) => {
  //   try {
  //     setLoading(true);
  //     const response = await gameHubApi.resetUserPassword(walletAddress, newPassword);
  //     if (response.success) {
  //       alert('Password reset successfully');
  //     }
  //   } catch (error) {
  //     alert('Failed to reset password: ' + (error instanceof Error ? error.message : 'Unknown error'));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDeductCoins = async (walletAddress: string, coinType: string, amount: number) => {
  //   try {
  //     setLoading(true);
  //     const response = await gameHubApi.deductUserCoins(walletAddress, coinType, amount);
  //     if (response.success) {
  //       alert('Coins deducted successfully');
  //     }
  //   } catch (error) {
  //     alert('Failed to deduct coins: ' + (error instanceof Error ? error.message : 'Unknown error'));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (!isAuthenticated) {
    return (
      <div className={`mx-auto max-w-md ${className}`}>
        <Card className="p-6">
          <div className="mb-6 text-center">
            <CogIcon className="mx-auto h-12 w-12 text-blue-500" />
            <h2 className="mt-2 font-bold text-2xl text-gray-900">
              Admin Login
            </h2>
            <p className="text-gray-600 text-sm">
              Access Game Hub administration panel
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor="admin-username"
              >
                Username
              </label>
              <Input
                className="mt-1"
                id="admin-username"
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value
                  }))
                }
                required
                type="text"
                value={loginForm.username}
              />
            </div>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor="admin-password"
              >
                Password
              </label>
              <Input
                className="mt-1"
                id="admin-password"
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value
                  }))
                }
                required
                type="password"
                value={loginForm.password}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">
            Game Hub Admin Panel
          </h1>
          <p className="text-gray-600 text-sm">
            Manage users, tournaments, and system settings
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="font-bold text-2xl text-gray-900">
                  {stats.totalUsers || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-gray-600 text-sm">Active Tournaments</p>
                <p className="font-bold text-2xl text-gray-900">
                  {tournaments.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-gray-600 text-sm">Total Withdrawals</p>
                <p className="font-bold text-2xl text-gray-900">
                  $
                  {withdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-gray-600 text-sm">System Health</p>
                <p className="font-bold text-2xl text-green-500">98%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="overview">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">System Overview</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900">Recent Activity</h4>
                <p className="text-gray-600 text-sm">
                  System is running normally
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Performance</h4>
                <p className="text-gray-600 text-sm">All systems operational</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="tournaments">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Tournament Management</h3>
              <Button disabled={loading} onClick={loadData}>
                Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div className="rounded-lg border p-4" key={tournament.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{tournament.gameName}</h4>
                      <p className="text-gray-600 text-sm">
                        {tournament.tagForSeo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${tournament.tournamentPrize} USDT
                      </p>
                      <p className="text-gray-600 text-sm">
                        {tournament.coinsGathered}/{tournament.storageCapacity}{" "}
                        coins
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={() => {
                        // Handle disable/enable tournament
                      }}
                      size="sm"
                      variant={
                        tournament.isDisabled ? "outline" : "destructive"
                      }
                    >
                      {tournament.isDisabled ? "Enable" : "Disable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="withdrawals">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">
              Withdrawal Management
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                        {withdrawal.userId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                        ${withdrawal.amount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                            withdrawal.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : withdrawal.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Button size="sm" variant="outline">
                          Process
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="settings">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">System Settings</h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="maintenance-toggle"
                >
                  System Maintenance
                </label>
                <Button className="mt-2" variant="outline">
                  Toggle Maintenance Mode
                </Button>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="data-export"
                >
                  Data Export
                </label>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline">
                    Export Users CSV
                  </Button>
                  <Button size="sm" variant="outline">
                    Export Tournaments CSV
                  </Button>
                </div>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="backup-generate"
                >
                  Backup
                </label>
                <Button className="mt-2" variant="outline">
                  Generate Backup
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameHubAdminPanel;
