import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { fa } from "date-fns/locale";
import { Bell, BellOff, Check, Filter, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Skeleton
} from "@/components/Shared/UI";
import { Badge } from "@/components/Shared/UI/Badge";
import { Button } from "@/components/Shared/UI/Button";

interface NotificationListProps {
  walletAddress: string;
}

interface Notification {
  id: string;
  type:
    | "Welcome"
    | "Premium"
    | "Quest"
    | "Reward"
    | "Referral"
    | "System"
    | "Marketing";
  title: string;
  message: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  actionMetadata?: any;
  createdAt: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

const fetchNotifications = async (
  walletAddress: string,
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<NotificationResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString()
  });

  if (unreadOnly) params.append("unreadOnly", "true");

  const response = await fetch(
    `/api/notification-system/${walletAddress}?${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
};

const markAsRead = async (notificationIds: string[]) => {
  const response = await fetch("/api/notification-system/mark-read", {
    body: JSON.stringify({ notificationIds }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Failed to mark notifications as read");
  }
  return response.json();
};

const markAllAsRead = async (walletAddress: string) => {
  const response = await fetch(
    `/api/notification-system/${walletAddress}/mark-all-read`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
  return response.json();
};

const deleteNotification = async (notificationId: string) => {
  const response = await fetch(`/api/notification-system/${notificationId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to delete notification");
  }
  return response.json();
};

const NotificationList: React.FC<NotificationListProps> = ({
  walletAddress
}) => {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryFn: () => fetchNotifications(walletAddress, page, 20, unreadOnly),
    queryKey: ["notifications", walletAddress, page, unreadOnly],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Notifications marked as read");
      queryClient.invalidateQueries({
        queryKey: ["notifications", walletAddress]
      });
      setSelectedNotifications([]);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(walletAddress),
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({
        queryKey: ["notifications", walletAddress]
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({
        queryKey: ["notifications", walletAddress]
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Welcome":
        return "👋";
      case "Premium":
        return "👑";
      case "Quest":
        return "🎯";
      case "Reward":
        return "🎁";
      case "Referral":
        return "👥";
      case "System":
        return "⚙️";
      case "Marketing":
        return "📢";
      default:
        return "🔔";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Welcome":
        return "bg-blue-100 text-blue-800";
      case "Premium":
        return "bg-purple-100 text-purple-800";
      case "Quest":
        return "bg-green-100 text-green-800";
      case "Reward":
        return "bg-yellow-100 text-yellow-800";
      case "Referral":
        return "bg-orange-100 text-orange-800";
      case "System":
        return "bg-gray-100 text-gray-800";
      case "Marketing":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Normal":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (!data) return;

    if (selectedNotifications.length === data.notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(data.notifications.map((n) => n.id));
    }
  };

  const handleMarkAsRead = () => {
    if (selectedNotifications.length === 0) return;
    markAsReadMutation.mutate(selectedNotifications);
  };

  const handleDelete = (notificationId: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      deleteMutation.mutate(notificationId);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              className="flex items-start space-x-4 rounded-lg border p-4"
              key={i}
            >
              <Skeleton className="mt-1 h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
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
            <p>Error loading notifications</p>
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
            <Bell className="h-5 w-5" />
            Notifications
            {data.unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {data.unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setUnreadOnly(!unreadOnly)}
              size="sm"
              variant={unreadOnly ? "primary" : "outline"}
            >
              <Filter className="mr-2 h-4 w-4" />
              {unreadOnly ? "All" : "Unread"}
            </Button>
            <Button
              disabled={
                markAllAsReadMutation.isPending || data.unreadCount === 0
              }
              onClick={() => markAllAsReadMutation.mutate()}
              size="sm"
              variant="outline"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        {data.notifications.length > 0 && (
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <Checkbox
              checked={
                selectedNotifications.length === data.notifications.length
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-gray-600 text-sm">
              {selectedNotifications.length} of {data.notifications.length}{" "}
              selected
            </span>
            {selectedNotifications.length > 0 && (
              <Button
                disabled={markAsReadMutation.isPending}
                onClick={handleMarkAsRead}
                size="sm"
                variant="outline"
              >
                <Check className="mr-2 h-4 w-4" />
                Mark as Read
              </Button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {data.notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <BellOff className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg">
                {unreadOnly
                  ? "No unread notifications"
                  : "No notifications found"}
              </p>
            </div>
          ) : (
            data.notifications.map((notification) => (
              <div
                className={`flex items-start space-x-4 rounded-lg border p-4 transition-all hover:shadow-md ${
                  notification.isRead
                    ? "bg-white"
                    : "border-blue-200 bg-blue-50"
                }`}
                key={notification.id}
              >
                <Checkbox
                  checked={selectedNotifications.includes(notification.id)}
                  onCheckedChange={() =>
                    handleSelectNotification(notification.id)
                  }
                />

                <div className="text-2xl">{getTypeIcon(notification.type)}</div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3
                      className={`font-semibold ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <p className="mb-3 text-gray-600 text-sm">
                    {notification.message}
                  </p>

                  <div className="mb-2 flex items-center gap-2">
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type === "Welcome" && "Welcome"}
                      {notification.type === "Premium" && "Premium"}
                      {notification.type === "Quest" && "Quest"}
                      {notification.type === "Reward" && "Reward"}
                      {notification.type === "Referral" && "Referral"}
                      {notification.type === "System" && "System"}
                      {notification.type === "Marketing" && "Marketing"}
                    </Badge>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {getPriorityLabel(notification.priority)}
                    </Badge>
                  </div>

                  <p className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true
                    })}
                    {notification.readAt && (
                      <span className="mr-2">
                        • Read{" "}
                        {formatDistanceToNow(new Date(notification.readAt), {
                          addSuffix: true
                        })}
                      </span>
                    )}
                  </p>

                  {notification.actionUrl && (
                    <Button
                      className="mt-2"
                      onClick={() =>
                        window.open(notification.actionUrl, "_blank")
                      }
                      size="sm"
                      variant="outline"
                    >
                      View Details
                    </Button>
                  )}
                </div>

                <Button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(notification.id)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

export default NotificationList;
