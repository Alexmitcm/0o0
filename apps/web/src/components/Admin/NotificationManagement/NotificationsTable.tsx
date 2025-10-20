import { useEffect, useId, useState } from "react";
import { gameHubApi } from "../../../lib/api/gameHubApi";

interface Notification {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  type: "info" | "warning" | "error" | "success" | "promotion";
  createdAt: string;
  recipients: number;
  isRead: boolean;
}

interface NotificationsTableProps {
  className?: string;
}

const NotificationsTable = ({ className = "" }: NotificationsTableProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await gameHubApi.getAdminNotifications();
        if (response.success) {
          setNotifications(response.data);
        }
      } catch (err) {
        setError("Failed to fetch notifications");
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await gameHubApi.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "promotion":
        return "bg-purple-100 text-purple-800";
      case "info":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-500 ${className}`}>
        Error loading notifications: {error}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-gray-200 border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
          <button
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            Create Notification
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {notifications.map((notification) => (
              <tr className="hover:bg-gray-50" key={notification.id}>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 text-sm">
                  {notification.title}
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-gray-500 text-sm">
                  {notification.description}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getPriorityColor(notification.priority)}`}
                  >
                    {notification.priority}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getTypeColor(notification.type)}`}
                  >
                    {notification.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {notification.recipients}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {formatDate(notification.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteNotification(notification.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh notifications
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

// Create Notification Modal Component
interface CreateNotificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateNotificationModal = ({
  onClose,
  onSuccess
}: CreateNotificationModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const priorityId = useId();
  const typeId = useId();
  const isAllId = useId();

  const [formData, setFormData] = useState({
    description: "",
    isAll: false,
    priority: "medium" as const,
    recipients: [] as string[],
    title: "",
    type: "info" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await gameHubApi.createNotification(formData);
      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">
            Create Notification
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={titleId}
              >
                Title
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={titleId}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
                required
                type="text"
                value={formData.title}
              />
            </div>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={descriptionId}
              >
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={descriptionId}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter notification description"
                rows={3}
                value={formData.description}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor={priorityId}
                >
                  Priority
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  id={priorityId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as any
                    })
                  }
                  value={formData.priority}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor={typeId}
                >
                  Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  id={typeId}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  value={formData.type}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
            </div>
            <div className="flex items-center">
              <input
                checked={formData.isAll}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                id={isAllId}
                onChange={(e) =>
                  setFormData({ ...formData, isAll: e.target.checked })
                }
                type="checkbox"
              />
              <label
                className="ml-2 block text-gray-900 text-sm"
                htmlFor={isAllId}
              >
                Send to all users
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="submit"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTable;
