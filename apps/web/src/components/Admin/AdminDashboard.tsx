import {
  ArrowDownTrayIcon,
  BellIcon,
  ChartBarIcon,
  CogIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PhotoIcon,
  ServerIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import LogoBar from "../Shared/LogoBar";
import { gameHubApi } from "../../lib/api/gameHubApi";
import AdminEndpoints from "./AdminEndpoints";
import BannerManagementPanel from "./BannerManagement/BannerManagementPanel";
import CaptchaSettingsPage from "./CaptchaSettings/CaptchaSettingsPage";
import DatabaseExport from "./DatabaseExport";
import LogoManagement from "./LogoManagement";
import NotificationsTable from "./NotificationManagement/NotificationsTable";
import StaminaSettingsPage from "./StaminaSettings/StaminaSettingsPage";
import TournamentTable from "./TournamentManagement/TournamentTable";
import TransactionManagementPanel from "./TransactionManagement/TransactionManagementPanel";
import UserGraphVisualization from "./UserGraph/UserGraphVisualization";
import UsersTable from "./UserManagement/UsersTable";

interface AdminDashboardProps {
  className?: string;
}

const AdminSimpleDashboard = ({ className = "" }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const stats = await gameHubApi.getAdminStats();
        setAdminStats(stats.data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const tabs = [
    { icon: ChartBarIcon, id: "dashboard", name: "Dashboard" },
    { icon: UserGroupIcon, id: "users", name: "User Management" },
    { icon: UserGroupIcon, id: "user-graph", name: "User Graph" },
    { icon: ShieldCheckIcon, id: "security", name: "Ban & Security" },
    { icon: TrophyIcon, id: "tournaments", name: "Tournaments" },
    { icon: BellIcon, id: "notifications", name: "Notifications" },
    { icon: CurrencyDollarIcon, id: "transactions", name: "Transactions" },
    { icon: DocumentTextIcon, id: "content", name: "Content Management" },
    { icon: PhotoIcon, id: "banners", name: "Banner Management" },
    { icon: PhotoIcon, id: "logos", name: "Logo Management" },
    { icon: ArrowDownTrayIcon, id: "export", name: "Database Export" },
    { icon: ServerIcon, id: "endpoints", name: "Admin Endpoints" },
    { icon: ShieldCheckIcon, id: "captcha", name: "Captcha Settings" },
    { icon: ChartBarIcon, id: "stamina", name: "Stamina Settings" },
    { icon: CogIcon, id: "settings", name: "Settings" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Admin Dashboard
              </h3>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2" />
                </div>
              ) : adminStats ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-gray-800 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-8 w-8 text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-400 text-sm">
                          Total Users
                        </p>
                        <p className="font-semibold text-2xl text-white">
                          {adminStats.overview?.totalUsers || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrophyIcon className="h-8 w-8 text-yellow-400" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-400 text-sm">
                          Active Tournaments
                        </p>
                        <p className="font-semibold text-2xl text-white">
                          {adminStats.overview?.activeTournaments || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-400 text-sm">
                          Total Coins
                        </p>
                        <p className="font-semibold text-2xl text-white">
                          {adminStats.overview?.totalCoins || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ShieldCheckIcon className="h-8 w-8 text-red-400" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-400 text-sm">
                          Banned Users
                        </p>
                        <p className="font-semibold text-2xl text-white">
                          {adminStats.overview?.bannedUsers || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  Failed to load dashboard data
                </div>
              )}
            </div>
          </div>
        );
      case "banners":
        return <BannerManagementPanel />;
      case "logos":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Live Preview
              </h3>
              <div className="rounded-lg border border-gray-600 bg-gray-900 p-4">
                <LogoBar />
              </div>
            </div>
            <LogoManagement />
          </div>
        );
      case "users":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                User Management
              </h3>
              <UsersTable />
            </div>
          </div>
        );
      case "user-graph":
        return <UserGraphVisualization />;
      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Ban & Security Management
              </h3>
              <div className="rounded-lg bg-gray-800 p-6">
                <p className="text-gray-400">
                  Security management features coming soon
                </p>
              </div>
            </div>
          </div>
        );
      case "tournaments":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Tournament Management
              </h3>
              <TournamentTable />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Notification Management
              </h3>
              <NotificationsTable />
            </div>
          </div>
        );
      case "transactions":
        return <TransactionManagementPanel />;
      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Analytics Dashboard
              </h3>
              <div className="rounded-lg bg-gray-800 p-6">
                <p className="text-gray-400">Analytics dashboard coming soon</p>
              </div>
            </div>
          </div>
        );
      case "content":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Content Management
              </h3>
              <div className="rounded-lg bg-gray-800 p-6">
                <p className="text-gray-400">
                  Content management features coming soon
                </p>
              </div>
            </div>
          </div>
        );
      case "export":
        return <DatabaseExport />;
      case "endpoints":
        return <AdminEndpoints />;
      case "captcha":
        return <CaptchaSettingsPage />;
      case "stamina":
        return <StaminaSettingsPage />;
      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-lg text-white">
                Settings
              </h3>
              <div className="rounded-lg bg-gray-800 p-6">
                <p className="text-gray-400">System settings coming soon</p>
              </div>
            </div>
          </div>
        );
      default:
        return <LogoManagement />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Manage your platform settings and content
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <div className="flex-shrink-0 lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="rounded-lg bg-gray-800 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSimpleDashboard;
