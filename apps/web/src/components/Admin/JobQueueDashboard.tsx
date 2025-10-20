import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../Shared/UI/StatusBanner";

interface QueueOverview {
  name: string;
  isPaused: boolean;
  counts: Record<string, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface JobSummary {
  id: string;
  name: string;
  status: string;
  attemptsMade: number;
  progress?: any;
  failedReason?: string;
  processedOn?: number | null;
  finishedOn?: number | null;
  timestamp: number;
}

const JobQueueDashboard = () => {
  const [queues, setQueues] = useState<string[]>([]);
  const [overview, setOverview] = useState<QueueOverview[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "waiting" | "active" | "delayed" | "completed" | "failed" | "paused"
  >("waiting");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOverview = useMemo(
    () => overview.find((q) => q.name === selectedQueue),
    [overview, selectedQueue]
  );

  const fetchQueues = async () => {
    const res = await fetch(`${HEY_API_URL}/admin/jobs/queues`);
    if (!res.ok) throw new Error("Failed to load queues");
    const data = await res.json();
    setQueues(data.queues || []);
    if (!selectedQueue && (data.queues?.length || 0) > 0) {
      setSelectedQueue(data.queues[0]);
    }
  };

  const fetchOverview = async () => {
    const res = await fetch(`${HEY_API_URL}/admin/jobs/overview`);
    if (!res.ok) throw new Error("Failed to load overview");
    const data = await res.json();
    setOverview(data.queues || []);
  };

  const fetchJobs = async () => {
    if (!selectedQueue) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        limit: String(limit),
        page: String(page),
        status
      });
      const res = await fetch(
        `${HEY_API_URL}/admin/jobs/queue/${selectedQueue}?${qs.toString()}`
      );
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    fetchOverview();
    const t = setInterval(fetchOverview, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [status, selectedQueue]);

  useEffect(() => {
    fetchJobs();
  }, [selectedQueue, status, page, limit]);

  const handlePause = async () => {
    if (!selectedQueue) return;
    await fetch(`${HEY_API_URL}/admin/jobs/queue/${selectedQueue}/pause`, {
      method: "POST"
    });
    fetchOverview();
  };
  const handleResume = async () => {
    if (!selectedQueue) return;
    await fetch(`${HEY_API_URL}/admin/jobs/queue/${selectedQueue}/resume`, {
      method: "POST"
    });
    fetchOverview();
  };
  const handleDrain = async () => {
    if (!selectedQueue) return;
    if (!confirm("Drain waiting jobs?")) return;
    await fetch(`${HEY_API_URL}/admin/jobs/queue/${selectedQueue}/drain`, {
      method: "POST"
    });
    fetchOverview();
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <StatusBanner />

      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          {queues.length === 0 ? (
            <div className="text-gray-500 text-sm dark:text-gray-400">
              No queues discovered.
            </div>
          ) : (
            queues.map((q) => (
              <button
                className={`rounded border px-3 py-1 text-sm dark:border-gray-700 ${selectedQueue === q ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}
                key={q}
                onClick={() => setSelectedQueue(q)}
                type="button"
              >
                {q}
              </button>
            ))
          )}
        </div>
      </div>

      {selectedOverview && (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                {selectedOverview.name}
              </div>
              <div className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                {selectedOverview.isPaused ? "Paused" : "Running"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded bg-yellow-600 px-3 py-1 text-white"
                onClick={handlePause}
                type="button"
              >
                Pause
              </button>
              <button
                className="rounded bg-green-600 px-3 py-1 text-white"
                onClick={handleResume}
                type="button"
              >
                Resume
              </button>
              <button
                className="rounded bg-red-600 px-3 py-1 text-white"
                onClick={handleDrain}
                type="button"
              >
                Drain
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
            {Object.entries(selectedOverview.counts).map(([k, v]) => (
              <div
                className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700"
                key={k}
              >
                <div className="text-gray-500 text-xs uppercase dark:text-gray-300">
                  {k}
                </div>
                <div className="font-bold text-gray-900 text-xl dark:text-gray-100">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              "waiting",
              "active",
              "delayed",
              "completed",
              "failed",
              "paused"
            ] as const
          ).map((s) => (
            <button
              className={`rounded px-3 py-1 text-sm ${status === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"}`}
              key={s}
              onClick={() => setStatus(s)}
              type="button"
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select
              className="rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              onChange={(e) => setLimit(Number(e.target.value))}
              value={limit}
              aria-label="Items per page"
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <button
              className="rounded border px-3 py-1 text-sm dark:border-gray-700"
              onClick={fetchJobs}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Timestamps
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                    colSpan={6}
                  >
                    Loading…
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                    colSpan={6}
                  >
                    No jobs
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="px-4 py-2 font-mono text-gray-700 text-sm dark:text-gray-200">
                      {j.id}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-sm dark:text-gray-100">
                      {j.name}
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-sm dark:text-gray-300">
                      {j.attemptsMade}
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-sm dark:text-gray-300">
                      {typeof j.progress === "object"
                        ? JSON.stringify(j.progress)
                        : (j.progress ?? "")}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs dark:text-gray-400">
                      <div>
                        created: {new Date(j.timestamp).toLocaleString()}
                      </div>
                      {j.processedOn ? (
                        <div>
                          processed: {new Date(j.processedOn).toLocaleString()}
                        </div>
                      ) : null}
                      {j.finishedOn ? (
                        <div>
                          finished: {new Date(j.finishedOn).toLocaleString()}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded bg-green-600 px-2 py-1 text-white text-xs"
                          onClick={async () => {
                            await fetch(
                              `${HEY_API_URL}/admin/jobs/job/${selectedQueue}/${j.id}/retry`,
                              { method: "POST" }
                            );
                            fetchJobs();
                          }}
                          type="button"
                        >
                          Retry
                        </button>
                        {status === "delayed" && (
                          <button
                            className="rounded bg-blue-600 px-2 py-1 text-white text-xs"
                            onClick={async () => {
                              await fetch(
                                `${HEY_API_URL}/admin/jobs/job/${selectedQueue}/${j.id}/promote`,
                                { method: "POST" }
                              );
                              fetchJobs();
                            }}
                            type="button"
                          >
                            Promote
                          </button>
                        )}
                        <button
                          className="rounded bg-yellow-600 px-2 py-1 text-white text-xs"
                          onClick={async () => {
                            await fetch(
                              `${HEY_API_URL}/admin/jobs/job/${selectedQueue}/${j.id}/discard`,
                              { method: "POST" }
                            );
                            fetchJobs();
                          }}
                          type="button"
                        >
                          Discard
                        </button>
                        <button
                          className="rounded bg-red-600 px-2 py-1 text-white text-xs"
                          onClick={async () => {
                            if (!confirm("Delete job?")) return;
                            await fetch(
                              `${HEY_API_URL}/admin/jobs/job/${selectedQueue}/${j.id}`,
                              { method: "DELETE" }
                            );
                            fetchJobs();
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-gray-500 text-xs dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} (
              {pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobQueueDashboard;