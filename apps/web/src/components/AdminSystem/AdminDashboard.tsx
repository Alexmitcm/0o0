import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Coins,
  Crown,
  DollarSign,
  Eye,
  Shield,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from "@/components/Shared/UI";

interface AdminStats {
  totalUsers: number;
  totalCoins: number;
  totalTransactions: number;
  totalTournaments: number;
  activeTournaments: number;
  totalPrizePool: number;
  bannedUsers: number;
  systemHealth: "Healthy" | "Warning" | "Critical";
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  const response = await fetch("/api/admin-system/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch admin stats");
  }
  return response.json();
};

const AdminDashboard: React.FC = () => {
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryFn: fetchAdminStats,
    queryKey: ["adminStats"],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="mt-2 h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading admin dashboard</p>
            <button
              className="mt-2 rounded border px-4 py-2 hover:bg-gray-50"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "Healthy":
        return "text-green-600 bg-green-100";
      case "Warning":
        return "text-yellow-600 bg-yellow-100";
      case "Critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const statCards = [
    {
      bgColor: "bg-blue-100",
      color: "text-blue-600",
      description: "Registered users",
      icon: Users,
      title: "Total Users",
      value: stats.totalUsers.toLocaleString()
    },
    {
      bgColor: "bg-yellow-100",
      color: "text-yellow-600",
      description: "Coins in circulation",
      icon: Coins,
      title: "Total Coins",
      value: stats.totalCoins.toLocaleString()
    },
    {
      bgColor: "bg-green-100",
      color: "text-green-600",
      description: "Total transactions",
      icon: TrendingUp,
      title: "Transactions",
      value: stats.totalTransactions.toLocaleString()
    },
    {
      bgColor: "bg-purple-100",
      color: "text-purple-600",
      description: "Total tournaments",
      icon: Crown,
      title: "Tournaments",
      value: stats.totalTournaments.toLocaleString()
    },
    {
      bgColor: "bg-orange-100",
      color: "text-orange-600",
      description: "Currently running",
      icon: Zap,
      title: "Active Tournaments",
      value: stats.activeTournaments.toLocaleString()
    },
    {
      bgColor: "bg-emerald-100",
      color: "text-emerald-600",
      description: "Total prize pool",
      icon: DollarSign,
      title: "Prize Pool",
      value: stats.totalPrizePool.toLocaleString()
    },
    {
      bgColor: "bg-red-100",
      color: "text-red-600",
      description: "Currently banned",
      icon: Shield,
      title: "Banned Users",
      value: stats.bannedUsers.toLocaleString()
    },
    {
      bgColor: getSystemHealthColor(stats.systemHealth).split(" ")[1],
      color: getSystemHealthColor(stats.systemHealth).split(" ")[0],
      description: "System status",
      icon: Eye,
      title: "System Health",
      value: stats.systemHealth
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 font-bold text-3xl text-gray-900">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor system performance and manage platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card
              className="transition-shadow hover:shadow-md"
              key={stat.title}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-gray-600 text-sm">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`font-bold text-2xl ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-gray-500 text-xs">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-gray-500 text-sm">
                  View and manage user accounts
                </p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50">
              <Crown className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Tournament Management</p>
                <p className="text-gray-500 text-sm">
                  Create and manage tournaments
                </p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Security Center</p>
                <p className="text-gray-500 text-sm">
                  Monitor security and bans
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
