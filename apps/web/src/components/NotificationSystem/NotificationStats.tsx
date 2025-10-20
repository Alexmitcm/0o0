import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, BellOff, TrendingUp } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from "@/components/Shared/UI";

interface NotificationStatsProps {
  walletAddress: string;
}

interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  readCount: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const fetchNotificationStats = async (
  walletAddress: string
): Promise<NotificationStats> => {
  const response = await fetch(
    `/api/notification-system/${walletAddress}/stats`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch notification stats");
  }
  const data = await response.json();
  return data.stats;
};

const NotificationStats: React.FC<NotificationStatsProps> = ({
  walletAddress
}) => {
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryFn: () => fetchNotificationStats(walletAddress),
    queryKey: ["notificationStats", walletAddress],
    refetchInterval: 60000 // Refetch every minute
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Welcome":
        return "Welcome";
      case "Premium":
        return "Premium";
      case "Quest":
        return "Quest";
      case "Reward":
        return "Reward";
      case "Referral":
        return "Referral";
      case "System":
        return "System";
      case "Marketing":
        return "Marketing";
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "Urgent";
      case "High":
        return "High";
      case "Normal":
        return "Normal";
      case "Low":
        return "Low";
      default:
        return priority;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Welcome":
        return "bg-blue-500";
      case "Premium":
        return "bg-purple-500";
      case "Quest":
        return "bg-green-500";
      case "Reward":
        return "bg-yellow-500";
      case "Referral":
        return "bg-orange-500";
      case "System":
        return "bg-gray-500";
      case "Marketing":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Normal":
        return "bg-blue-500";
      case "Low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading notification stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalCount}</div>
            <p className="text-muted-foreground text-xs">
              Total notifications received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Unread</CardTitle>
            <BellOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-600">
              {stats.unreadCount}
            </div>
            <p className="text-muted-foreground text-xs">New notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Read</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {stats.readCount}
            </div>
            <p className="text-muted-foreground text-xs">
              Notifications viewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Read Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.totalCount > 0
                ? Math.round((stats.readCount / stats.totalCount) * 100)
                : 0}
              %
            </div>
            <p className="text-muted-foreground text-xs">
              Percentage of notifications read
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              By Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div className="flex items-center justify-between" key={type}>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${getTypeColor(type)}`}
                  />
                  <span className="font-medium text-sm">
                    {getTypeLabel(type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">{count}</span>
                  <div className="h-2 w-20 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${getTypeColor(type)}`}
                      style={{
                        width: `${stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              By Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div className="flex items-center justify-between" key={priority}>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${getPriorityColor(priority)}`}
                  />
                  <span className="font-medium text-sm">
                    {getPriorityLabel(priority)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">{count}</span>
                  <div className="h-2 w-20 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                      style={{
                        width: `${stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationStats;
