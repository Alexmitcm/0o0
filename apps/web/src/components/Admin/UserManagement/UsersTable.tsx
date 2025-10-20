import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  walletAddress: string;
  email?: string;
  parentWalletAddress?: string;
  createdAt: string;
  userType?: string;
  leftNode?: number;
  rightNode?: number;
  allEquilibrium?: number;
  oxCoins?: number;
}

interface UsersTableProps {
  className?: string;
}

const UsersTable = ({ className = "" }: UsersTableProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mock data for now - replace with actual API call
  const mockUsers: User[] = [
    {
      allEquilibrium: 8,
      createdAt: "2025-01-01T00:00:00Z",
      email: "user1@example.com",
      id: "1",
      leftNode: 5,
      oxCoins: 1000,
      parentWalletAddress: "0x0987654321098765432109876543210987654321",
      rightNode: 3,
      userType: "Premium",
      walletAddress: "0x1234567890123456789012345678901234567890"
    },
    {
      allEquilibrium: 6,
      createdAt: "2025-01-02T00:00:00Z",
      email: "user2@example.com",
      id: "2",
      leftNode: 2,
      oxCoins: 500,
      parentWalletAddress: "0x1234567890123456789012345678901234567890",
      rightNode: 4,
      userType: "Standard",
      walletAddress: "0x2345678901234567890123456789012345678901"
    }
  ];

  const handleUserClick = (walletAddress: string) => {
    navigate(`/admin/users/${walletAddress}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        Error loading users: {error}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Wallet Address
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Parent Wallet
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Left Node
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Right Node
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                All Equilibrium
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                OxCoins
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {mockUsers.map((user) => (
              <tr
                className="cursor-pointer transition-colors hover:bg-gray-50"
                key={user.id}
                onClick={() => handleUserClick(user.walletAddress)}
              >
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 text-sm">
                  User #{user.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {formatDate(user.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {user.email || "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-500 text-sm">
                  {formatWalletAddress(user.walletAddress)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                      user.userType === "Premium"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.userType || "Standard"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-500 text-sm">
                  {user.parentWalletAddress
                    ? formatWalletAddress(user.parentWalletAddress)
                    : "N/A"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {user.leftNode || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {user.rightNode || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {user.allEquilibrium || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {user.oxCoins || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
