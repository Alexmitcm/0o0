import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { fa } from "date-fns/locale";
import {
  Ban,
  CheckCircle,
  Crown,
  Eye,
  Search,
  Shield,
  UserCheck,
  Users
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  Skeleton
} from "@/components/Shared/UI";
import { Badge } from "@/components/Shared/UI/Badge";
import { Button } from "@/components/Shared/UI/Button";
import { Input } from "@/components/Shared/UI/Input";

interface User {
  id: string;
  username: string;
  displayName?: string;
  walletAddress: string;
  coins: number;
  staminaLevel: number;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastActiveAt: string;
  transactionCount: number;
  tournamentCount: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

const fetchUsers = async (
  page = 1,
  limit = 20,
  search = "",
  status = ""
): Promise<UsersResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString()
  });

  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const response = await fetch(`/api/admin-system/users?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

const banUser = async (walletAddress: string, reason: string) => {
  const response = await fetch("/api/admin-system/ban-user", {
    body: JSON.stringify({ reason, walletAddress }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to ban user");
  }

  return response.json();
};

const unbanUser = async (walletAddress: string) => {
  const response = await fetch("/api/admin-system/unban-user", {
    body: JSON.stringify({ walletAddress }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unban user");
  }

  return response.json();
};

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banningUser, setBanningUser] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryFn: () => fetchUsers(page, 20, search, status),
    queryKey: ["adminUsers", page, search, status],
    refetchInterval: 30000
  });

  const banMutation = useMutation({
    mutationFn: ({
      walletAddress,
      reason
    }: {
      walletAddress: string;
      reason: string;
    }) => banUser(walletAddress, reason),
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("User banned successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setBanningUser(null);
      setBanReason("");
    }
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("User unbanned successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    }
  });

  const handleBanUser = (walletAddress: string) => {
    if (!banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }
    banMutation.mutate({ reason: banReason, walletAddress });
  };

  const handleUnbanUser = (walletAddress: string) => {
    unbanMutation.mutate(walletAddress);
  };

  const getStatusColor = (isBanned: boolean) => {
    return isBanned ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  const getStatusLabel = (isBanned: boolean) => {
    return isBanned ? "Banned" : "Active";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-5 w-96" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
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
            <p>Error loading users</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="flex items-center justify-center gap-2 font-bold text-2xl text-gray-900">
          <Users className="h-6 w-6" />
          User Management
        </h2>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-64 flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username or wallet address..."
            value={search}
          />
        </div>
        <Select
          onValueChange={setStatus}
          options={[
            { label: "All Users", value: "" },
            { label: "Active", value: "active" },
            { label: "Banned", value: "banned" }
          ]}
          value={status}
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {data.users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-lg">No users found</p>
            </CardContent>
          </Card>
        ) : (
          data.users.map((user) => (
            <Card className="transition-shadow hover:shadow-md" key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <UserCheck className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate font-semibold text-gray-900">
                          {user.displayName || user.username}
                        </h3>
                        <Badge className={getStatusColor(user.isBanned)}>
                          {getStatusLabel(user.isBanned)}
                        </Badge>
                        {user.tournamentCount > 0 && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Crown className="mr-1 h-3 w-3" />
                            {user.tournamentCount} tournaments
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">@{user.username}</p>
                      <p className="text-gray-400 text-xs">
                        {user.walletAddress.slice(0, 6)}...
                        {user.walletAddress.slice(-4)}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-gray-500 text-sm">
                        <span>{user.coins.toLocaleString()} coins</span>
                        <span>Level {user.staminaLevel}</span>
                        <span>{user.transactionCount} transactions</span>
                        <span>
                          Last active:{" "}
                          {formatDistanceToNow(new Date(user.lastActiveAt), {
                            addSuffix: true
                          })}
                        </span>
                      </div>
                      {user.isBanned && user.banReason && (
                        <div className="mt-2 rounded bg-red-50 p-2">
                          <p className="text-red-700 text-sm">
                            <strong>Ban reason:</strong> {user.banReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setBanningUser(user.walletAddress)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                    {user.isBanned ? (
                      <Button
                        disabled={unbanMutation.isPending}
                        onClick={() => handleUnbanUser(user.walletAddress)}
                        size="sm"
                        variant="outline"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setBanningUser(user.walletAddress)}
                        size="sm"
                        variant="destructive"
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        Ban User
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ban Modal */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Ban User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="ban-reason"
                >
                  Ban Reason
                </Label>
                <Input
                  id="ban-reason"
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  value={banReason}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setBanningUser(null);
                    setBanReason("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!banReason.trim() || banMutation.isPending}
                  onClick={() => handleBanUser(banningUser)}
                  variant="destructive"
                >
                  {banMutation.isPending ? "Banning..." : "Ban User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
    </div>
  );
};

export default UserManagement;
