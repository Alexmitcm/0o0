import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import { useGameHub } from "@/hooks/useGameHub";
import type { NotificationData } from "@/lib/api/gameHubApi";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter = ({ className = "" }: NotificationCenterProps) => {
  const {
    notifications,
    loading,
    error,
    markNotificationAsSeen,
    deleteNotification
  } = useGameHub();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isSeen).length;

  const handleMarkAsSeen = async (notificationId: string) => {
    try {
      await markNotificationAsSeen(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as seen:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsSeen = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isSeen);
      await Promise.all(
        unreadNotifications.map((n) => markNotificationAsSeen(n.id))
      );
    } catch (error) {
      console.error("Failed to mark all as seen:", error);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-700" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        aria-label="Toggle notifications"
        className="relative rounded-full p-2 text-gray-400 hover:bg-gray-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 z-50 w-80 rounded-lg border border-white/10 bg-gray-800 shadow-xl">
          <div className="border-white/10 border-b p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    className="text-xs"
                    onClick={handleMarkAllAsSeen}
                    size="sm"
                    variant="ghost"
                  >
                    Mark all read
                  </Button>
                )}
                <button
                  aria-label="Close notifications"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {error && (
              <div className="p-4 text-center">
                <div className="mb-2 text-2xl">⚠️</div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!notifications.length && !error && (
              <div className="p-6 text-center">
                <div className="mb-2 text-4xl">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            )}

            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDelete={handleDelete}
                onMarkAsSeen={handleMarkAsSeen}
              />
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="border-white/10 border-t p-4">
              <Button
                className="w-full text-sm"
                onClick={() => setIsOpen(false)}
                type="button"
                variant="ghost"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsSeen: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const NotificationItem = ({
  notification,
  onMarkAsSeen,
  onDelete
}: NotificationItemProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-400";
      case "HIGH":
        return "text-orange-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "🚨";
      case "HIGH":
        return "⚠️";
      case "MEDIUM":
        return "ℹ️";
      case "LOW":
        return "💡";
      default:
        return "📢";
    }
  };

  return (
    <div
      className={`border-white/5 border-b p-4 transition-colors hover:bg-gray-700/30 ${
        notification.isSeen ? "" : "bg-blue-900/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-lg">{getPriorityIcon(notification.priority)}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4
              className={`font-medium text-sm ${
                notification.isSeen ? "text-gray-300" : "text-white"
              }`}
            >
              {notification.title}
            </h4>
            <span
              className={`text-xs ${getPriorityColor(notification.priority)}`}
            >
              {notification.priority}
            </span>
            {notification.isSeen || (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="mb-2 text-gray-400 text-sm">{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">
              {new Date(notification.createdAt).toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              {notification.isSeen || (
                <button
                  className="text-blue-400 text-xs hover:text-blue-300"
                  onClick={() => onMarkAsSeen(notification.id)}
                  type="button"
                >
                  Mark read
                </button>
              )}
              <button
                className="text-gray-500 text-xs hover:text-red-400"
                onClick={() => onDelete(notification.id)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
