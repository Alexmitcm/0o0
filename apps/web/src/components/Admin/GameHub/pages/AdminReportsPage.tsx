import { HEY_API_URL } from "@hey/data/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface GameReport {
  id: string;
  gameId: string;
  reporterAddress: string;
  reason: string;
  description: string;
  createdAt: string;
  game?: {
    id: string;
    title: string;
    slug: string;
  };
}

const AdminReportsPage = () => {
  const queryClient = useQueryClient();
  const [filterReason, setFilterReason] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryFn: async (): Promise<{ reports: GameReport[]; total: number }> => {
      const params = new URLSearchParams();
      if (filterReason) params.append("reason", filterReason);
      params.append("limit", "100");

      const res = await fetch(`${HEY_API_URL}/games/manage/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    queryKey: ["admin-reports", filterReason]
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(
        `${HEY_API_URL}/games/manage/reports/${reportId}`,
        {
          method: "DELETE"
        }
      );
      if (!res.ok) throw new Error("Failed to delete report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    }
  });

  const handleDeleteReport = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">Error loading reports: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl text-gray-900">Game Reports</h1>
        <div className="flex items-center gap-4">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            onChange={(e) => setFilterReason(e.target.value)}
            value={filterReason}
          >
            <option value="">All Reasons</option>
            <option value="Bug">Bug</option>
            <option value="Error">Error</option>
            <option value="Other">Other</option>
          </select>
          <span className="text-gray-600 text-sm">
            {data?.total || 0} total reports
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Game
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Reporter
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data?.reports.map((report) => (
              <tr className="hover:bg-gray-50" key={report.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">
                    {report.game?.title || "Unknown Game"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {report.game?.slug || "No slug"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 font-semibold text-xs leading-5 ${
                      report.reason === "Bug"
                        ? "bg-red-100 text-red-800"
                        : report.reason === "Error"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {report.reason}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                  {report.reporterAddress === "anonymous"
                    ? "Anonymous"
                    : `${report.reporterAddress.slice(0, 6)}...${report.reporterAddress.slice(-4)}`}
                </td>
                <td className="px-6 py-4 text-gray-900 text-sm">
                  <div className="max-w-xs truncate">
                    {report.description || "No description"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                  <button
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteReportMutation.isPending}
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    {deleteReportMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.reports.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">No reports found.</p>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
