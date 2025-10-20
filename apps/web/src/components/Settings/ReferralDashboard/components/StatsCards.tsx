import { UsersIcon, WalletIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import type { ReferralStats } from "../types";

interface StatsCardsProps {
  stats: ReferralStats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <WalletIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-600 text-sm">Total Balance</p>
            <p className="font-bold text-gray-900 text-xl">
              {Number(stats.totalBalance).toFixed(4)} USDT
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <UsersIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-600 text-sm">Network Depth</p>
            <p className="font-bold text-gray-900 text-xl">
              {stats.networkDepth} levels
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
            <SparklesIcon className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-600 text-sm">Points</p>
            <p className="font-bold text-gray-900 text-xl">{stats.points}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              stats.isUnbalanced ? "bg-orange-100" : "bg-blue-100"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                stats.isUnbalanced ? "bg-orange-600" : "bg-blue-600"
              }`}
            />
          </div>
          <div>
            <p className="font-medium text-gray-600 text-sm">Status</p>
            <p className="font-bold text-gray-900 text-xl">
              {stats.isUnbalanced ? "Unbalanced" : "Balanced"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
