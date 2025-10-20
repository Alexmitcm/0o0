import {
  ChartBarIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { HEY_API_URL } from "@hey/data/constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, Card, CardHeader } from "../Shared/UI";
import fetchApi from "../../helpers/fetcher";

interface NodeData {
  startTime: bigint;
  balance: bigint;
  point: number;
  depthLeftBranch: number;
  depthRightBranch: number;
  depth: number;
  player: string;
  parent: string;
  leftChild: string;
  rightChild: string;
  isPointChanged: boolean;
  unbalancedAllowance: boolean;
}

interface UnbalancedNodeData {
  startTime: bigint;
  payment: bigint;
  point: number;
  isPointChanged: boolean;
}

interface RouteCounters {
  total: number;
  s2xx: number;
  s3xx: number;
  s4xx: number;
  s5xx: number;
  s429: number;
}

interface RouteStats {
  counters: RouteCounters;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  latenciesSmall?: number[];
}

interface MetricsSnapshot {
  routes: Record<string, RouteStats>;
  generatedAt: string;
}

const DataMonitor = () => {
  const [selectedContract, setSelectedContract] = useState<
    "referral" | "gameVault"
  >("referral");
  const [playerAddress, setPlayerAddress] = useState("");
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [unbalancedNodeData, setUnbalancedNodeData] =
    useState<UnbalancedNodeData | null>(null);
  const [playerBalance, setPlayerBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Service Metrics State
  const [metricsFilter, setMetricsFilter] = useState("");
  const [metricsSort, setMetricsSort] = useState<
    "total" | "s5xx" | "p95" | "p99"
  >("p95");
  const [autoRefreshMetrics, setAutoRefreshMetrics] = useState(true);
  const [showProm, setShowProm] = useState(false);
  const [groupByPrefix, setGroupByPrefix] = useState(true);
  const [combineMethods, setCombineMethods] = useState(true);
  const [s5xxThreshold, setS5xxThreshold] = useState(1);
  const [s429Threshold, setS429Threshold] = useState(10);
  const [latWindowCount, setLatWindowCount] = useState<20 | 50>(50);

  const {
    data: metrics,
    isFetching: metricsLoading,
    refetch: refetchMetrics
  } = useQuery<MetricsSnapshot>({
    enabled: true,
    queryFn: () => fetchApi<MetricsSnapshot>("/metrics", { method: "GET" }),
    queryKey: ["admin-metrics"],
    refetchInterval: autoRefreshMetrics ? 5000 : false,
    refetchOnWindowFocus: false
  });

  const filteredMetrics = useMemo(() => {
    if (!metrics) return [] as Array<[string, RouteStats]>;

    const entries = Object.entries(metrics.routes);

    const grouped: Record<string, RouteStats> = {};

    const percentile = (values: number[], p: number): number => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const idx = Math.min(
        sorted.length - 1,
        Math.max(0, Math.floor((p / 100) * sorted.length))
      );
      return sorted[idx];
    };

    if (groupByPrefix || combineMethods) {
      for (const [key, stats] of entries) {
        const spaceIdx = key.indexOf(" ");
        const method = spaceIdx > 0 ? key.slice(0, spaceIdx) : "";
        const path = spaceIdx > 0 ? key.slice(spaceIdx + 1) : key;
        const seg = path.split("/").filter(Boolean)[0] || "";
        const prefix = seg ? `/${seg}` : "/";
        const groupKey = `${combineMethods ? "*" : method} ${groupByPrefix ? prefix : path}`;

        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            counters: { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0, s429: 0, total: 0 },
            latenciesSmall: [],
            p50: 0,
            p95: 0,
            p99: 0
          } as RouteStats;
        }
        const g = grouped[groupKey];
        g.counters.total += stats.counters.total;
        g.counters.s2xx += stats.counters.s2xx;
        g.counters.s3xx += stats.counters.s3xx;
        g.counters.s4xx += stats.counters.s4xx;
        g.counters.s5xx += stats.counters.s5xx;
        g.counters.s429 += stats.counters.s429;
        if (
          (stats as any).latenciesSmall &&
          (stats as any).latenciesSmall.length > 0
        ) {
          const add = (stats as any).latenciesSmall as number[];
          (g as any).latenciesSmall = [
            ...((g as any).latenciesSmall || []),
            ...add
          ].slice(-latWindowCount);
        }
      }
      for (const k of Object.keys(grouped)) {
        const vals = (grouped as any)[k].latenciesSmall || [];
        grouped[k].p50 = percentile(vals, 50);
        grouped[k].p95 = percentile(vals, 95);
        grouped[k].p99 = percentile(vals, 99);
      }
    }

    const source =
      groupByPrefix || combineMethods ? Object.entries(grouped) : entries;

    const filtered = metricsFilter
      ? source.filter(([route]) =>
          route.toLowerCase().includes(metricsFilter.toLowerCase())
        )
      : source;

    const sorted = [...filtered].sort((a, b) => {
      const aStats = a[1];
      const bStats = b[1];
      if (metricsSort === "total")
        return bStats.counters.total - aStats.counters.total;
      if (metricsSort === "s5xx")
        return bStats.counters.s5xx - aStats.counters.s5xx;
      if (metricsSort === "p95") return (bStats.p95 ?? 0) - (aStats.p95 ?? 0);
      return (bStats.p99 ?? 0) - (aStats.p99 ?? 0);
    });

    return sorted.slice(0, 100);
  }, [
    metrics,
    metricsFilter,
    metricsSort,
    groupByPrefix,
    combineMethods,
    latWindowCount
  ]);

  const {
    data: promText,
    isFetching: promLoading,
    refetch: refetchProm
  } = useQuery<string>({
    enabled: showProm,
    queryFn: async () => {
      const res = await fetch(`${HEY_API_URL}/metrics/prom`);
      return await res.text();
    },
    queryKey: ["admin-metrics-prom"],
    refetchInterval: showProm && autoRefreshMetrics ? 5000 : false,
    refetchOnWindowFocus: false
  });

  const handleExportCsv = () => {
    try {
      const headers = [
        "route",
        "total",
        "s2xx",
        "s3xx",
        "s4xx",
        "s429",
        "s5xx",
        "p50",
        "p95",
        "p99"
      ];
      const toCsvValue = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
      const rows = filteredMetrics.map(([route, stats]) => [
        route,
        stats.counters.total,
        stats.counters.s2xx,
        stats.counters.s3xx,
        stats.counters.s4xx,
        stats.counters.s429,
        stats.counters.s5xx,
        stats.p50 ?? 0,
        stats.p95 ?? 0,
        stats.p99 ?? 0
      ]);
      const csv = [
        headers.map(toCsvValue).join(","),
        ...rows.map((r) => r.map(toCsvValue).join(","))
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metrics-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const fetchPlayerNodeData = async () => {
    if (!playerAddress) {
      toast.error("Please enter a player address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use a placeholder approach since the contract reading needs proper setup
      toast.info(
        "Contract reading functionality needs proper wagmi configuration"
      );
      setNodeData(null);
      setUnbalancedNodeData(null);
    } catch (error) {
      toast.error("Failed to fetch player node data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnbalancedPlayerNodeData = async () => {
    if (!playerAddress) {
      toast.error("Please enter a player address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use a placeholder approach since the contract reading needs proper setup
      toast.info(
        "Contract reading functionality needs proper wagmi configuration"
      );
      setUnbalancedNodeData(null);
      setNodeData(null);
    } catch (error) {
      toast.error("Failed to fetch unbalanced player node data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayerBalance = async () => {
    if (!playerAddress) {
      toast.error("Please enter a player address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use a placeholder approach since the contract reading needs proper setup
      toast.info(
        "Contract reading functionality needs proper wagmi configuration"
      );
      setPlayerBalance("0");
      setNodeData(null);
      setUnbalancedNodeData(null);
    } catch (error) {
      toast.error("Failed to fetch player balance");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setNodeData(null);
    setUnbalancedNodeData(null);
    setPlayerBalance(null);
    setPlayerAddress("");
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatWei = (wei: bigint) => {
    return wei.toString();
  };

  const contracts = [
    {
      color: "blue",
      description: "View player node information and referral data",
      icon: ChartBarIcon,
      id: "referral",
      name: "Referral Contract Data"
    },
    {
      color: "green",
      description: "View player balances and reward information",
      icon: DocumentTextIcon,
      id: "gameVault",
      name: "Game Vault Contract Data"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Service Metrics */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader title="Service Metrics" />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              aria-label="Filter routes"
              className="w-64 rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              onChange={(e) => setMetricsFilter(e.target.value)}
              placeholder="Filter by route or method"
              type="text"
              value={metricsFilter}
            />
            <select
              aria-label="Sort metrics by"
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              onChange={(e) =>
                setMetricsSort(
                  e.target.value as "total" | "s5xx" | "p95" | "p99"
                )
              }
              value={metricsSort}
            >
              <option value="s5xx">Sort: 5xx desc</option>
              <option value="p95">Sort: p95 desc</option>
              <option value="p99">Sort: p99 desc</option>
              <option value="total">Sort: total desc</option>
            </select>
            <label className="flex items-center space-x-2">
              <input
                aria-label="Auto-refresh metrics"
                checked={autoRefreshMetrics}
                className="h-4 w-4"
                onChange={(e) => setAutoRefreshMetrics(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm">Auto refresh</span>
            </label>
            <label className="ml-2 flex items-center space-x-2">
              <input
                aria-label="Group by path prefix"
                checked={groupByPrefix}
                className="h-4 w-4"
                onChange={(e) => setGroupByPrefix(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm">Group by prefix</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                aria-label="Combine methods"
                checked={combineMethods}
                className="h-4 w-4"
                onChange={(e) => setCombineMethods(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm">Combine methods</span>
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-gray-700 text-sm">Latency points</span>
              <select
                aria-label="Latency window"
                className="rounded-md border border-gray-300 px-2 py-1 focus:border-purple-500 focus:outline-none"
                onChange={(e) =>
                  setLatWindowCount((Number(e.target.value) as 20 | 50) || 50)
                }
                value={latWindowCount}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <Button
              aria-label="Refresh metrics"
              disabled={metricsLoading}
              onClick={() => refetchMetrics()}
              variant="outline"
            >
              {metricsLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <label className="ml-2 flex items-center space-x-2">
              <input
                aria-label="Show Prometheus raw"
                checked={showProm}
                className="h-4 w-4"
                onChange={(e) => setShowProm(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm">Show Prom</span>
            </label>
            {showProm && (
              <Button
                aria-label="Refresh Prometheus"
                disabled={promLoading}
                onClick={() => refetchProm()}
                variant="outline"
              >
                {promLoading ? "Refreshing..." : "Refresh Prom"}
              </Button>
            )}
            <Button
              aria-label="Export metrics to CSV"
              onClick={handleExportCsv}
              variant="outline"
            >
              Export CSV
            </Button>
            {metrics?.generatedAt && (
              <span className="text-gray-600 text-sm">
                Last updated:{" "}
                {new Date(metrics.generatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {showProm && (
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-700 text-sm">/metrics/prom</span>
                <Button
                  aria-label="Copy Prometheus output"
                  onClick={() => {
                    if (promText)
                      navigator.clipboard
                        .writeText(promText)
                        .then(() => toast.success("Copied"));
                  }}
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto rounded bg-gray-900 p-3 text-green-300 text-xs">
                {promText ?? ""}
              </pre>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 text-xs uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    2xx
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    3xx
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    4xx
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    429
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    5xx
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    Alerts
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    Thresholds
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    p50 (ms)
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    p95 (ms)
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    p99 (ms)
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 text-xs uppercase tracking-wider">
                    Sparkline
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredMetrics.map(([route, stats]) => {
                  const exceedS5xx = stats.counters.s5xx >= s5xxThreshold;
                  const exceed429 = stats.counters.s429 >= s429Threshold;
                  return (
                    <tr
                      className={`${exceedS5xx ? "bg-red-50" : exceed429 ? "bg-amber-50" : ""}`}
                      key={route}
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                        <code className="rounded bg-gray-100 px-2 py-1">
                          {route}
                        </code>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.counters.total}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.counters.s2xx}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.counters.s3xx}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.counters.s4xx}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.counters.s429}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-red-600">
                        {stats.counters.s5xx}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <div className="flex justify-end gap-2">
                          {stats.counters.s5xx > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] text-red-700 ${exceedS5xx ? "bg-red-200" : "bg-red-100"}`}
                            >
                              5xx {stats.counters.s5xx}
                            </span>
                          )}
                          {stats.counters.s429 > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] text-amber-800 ${exceed429 ? "bg-amber-200" : "bg-amber-100"}`}
                            >
                              429 {stats.counters.s429}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <label className="flex items-center space-x-1">
                            <span className="text-gray-500 text-xs">5xx</span>
                            <input
                              aria-label="5xx threshold"
                              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-xs focus:border-purple-500 focus:outline-none"
                              onChange={(e) =>
                                setS5xxThreshold(Number(e.target.value) || 0)
                              }
                              type="number"
                              value={s5xxThreshold}
                            />
                          </label>
                          <label className="flex items-center space-x-1">
                            <span className="text-gray-500 text-xs">429</span>
                            <input
                              aria-label="429 threshold"
                              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-xs focus:border-purple-500 focus:outline-none"
                              onChange={(e) =>
                                setS429Threshold(Number(e.target.value) || 0)
                              }
                              type="number"
                              value={s429Threshold}
                            />
                          </label>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.p50 ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.p95 ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {stats.p99 ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {stats.latenciesSmall &&
                        stats.latenciesSmall.length > 0 ? (
                          <div className="h-6 w-40">
                            <svg
                              aria-label="Latency sparkline"
                              className="h-full w-full"
                              preserveAspectRatio="none"
                              role="img"
                              viewBox="0 0 100 24"
                            >
                              {(() => {
                                const vals = (
                                  stats.latenciesSmall as number[]
                                ).slice(-50);
                                const max = Math.max(...vals, 1);
                                const min = Math.min(...vals, 0);
                                const range = Math.max(max - min, 1);
                                const step = 100 / Math.max(vals.length - 1, 1);
                                const points = vals
                                  .map((v, i) => {
                                    const x = i * step;
                                    const y = 24 - ((v - min) / range) * 24;
                                    return `${x},${y}`;
                                  })
                                  .join(" ");
                                return (
                                  <polyline
                                    fill="none"
                                    points={points}
                                    stroke="#4F46E5"
                                    strokeWidth="1.5"
                                  />
                                );
                              })()}
                            </svg>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredMetrics.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={13}
                    >
                      {metricsLoading
                        ? "Loading metrics..."
                        : "No metrics to display"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      <div className="mb-6 flex items-center space-x-3">
        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
        <h2 className="font-bold text-2xl text-gray-900">
          On-Chain Data Monitor
        </h2>
      </div>

      {/* Contract Selection */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {contracts.map((contract) => {
          const colorClasses = {
            blue: "border-blue-200 bg-blue-50",
            green: "border-green-200 bg-green-50"
          };

          return (
            <Card
              aria-label={`Select ${contract.name}`}
              className={`cursor-pointer border-2 transition-all duration-200 ${
                selectedContract === contract.id
                  ? colorClasses[contract.color as keyof typeof colorClasses] +
                    " ring-2 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              key={contract.id}
              onClick={() =>
                setSelectedContract(contract.id as "referral" | "gameVault")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedContract(contract.id as "referral" | "gameVault");
                }
              }}
            >
              <CardHeader title={contract.name} />
              <div className="p-6">
                <p className="text-gray-600">{contract.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Data Query Section */}
      <Card className="border-2 border-indigo-200 bg-indigo-50">
        <CardHeader title="Query Player Data" />
        <div className="space-y-4 p-6">
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="player-address-input"
            >
              Player Address
            </label>
            <div className="flex space-x-2">
              <input
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                id="player-address-input"
                onChange={(e) => setPlayerAddress(e.target.value)}
                placeholder="0x..."
                type="text"
                value={playerAddress}
              />
              <Button
                disabled={isLoading}
                onClick={clearData}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedContract === "referral" ? (
              <>
                <Button
                  className="flex items-center space-x-2"
                  disabled={isLoading || !playerAddress}
                  onClick={fetchPlayerNodeData}
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Get Player Node</span>
                </Button>
                <Button
                  className="flex items-center space-x-2"
                  disabled={isLoading || !playerAddress}
                  onClick={fetchUnbalancedPlayerNodeData}
                  variant="outline"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>Get Unbalanced Node</span>
                </Button>
              </>
            ) : (
              <Button
                className="flex items-center space-x-2"
                disabled={isLoading || !playerAddress}
                onClick={fetchPlayerBalance}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Get Player Balance</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results Display */}
      {isLoading && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <div className="p-6 text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
            <p className="text-gray-600">Fetching data from blockchain...</p>
          </div>
        </Card>
      )}

      {/* Player Node Data */}
      {nodeData && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader title="Player Node Data" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-gray-900">
                  Basic Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Player:</span>
                    <code className="rounded bg-gray-100 px-2 py-1">
                      {nodeData.player}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parent:</span>
                    <code className="rounded bg-gray-100 px-2 py-1">
                      {nodeData.parent}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Left Child:</span>
                    <code className="rounded bg-gray-100 px-2 py-1">
                      {nodeData.leftChild}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Right Child:</span>
                    <code className="rounded bg-gray-100 px-2 py-1">
                      {nodeData.rightChild}
                    </code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-900">
                  Node Properties
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span>{formatTimestamp(nodeData.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span>{formatWei(nodeData.balance)} wei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Point:</span>
                    <span>{nodeData.point}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Depth:</span>
                    <span>{nodeData.depth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Left Branch Depth:</span>
                    <span>{nodeData.depthLeftBranch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Right Branch Depth:</span>
                    <span>{nodeData.depthRightBranch}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 border-gray-200 border-t pt-4">
              <h4 className="mb-2 font-medium text-gray-900">Flags</h4>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Point Changed:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      nodeData.isPointChanged
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {nodeData.isPointChanged ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Unbalanced Allowance:</span>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      nodeData.unbalancedAllowance
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {nodeData.unbalancedAllowance ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Unbalanced Node Data */}
      {unbalancedNodeData && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader title="Unbalanced Player Node Data" />
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-gray-900">
                  Node Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span>{formatTimestamp(unbalancedNodeData.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span>{formatWei(unbalancedNodeData.payment)} wei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Point:</span>
                    <span>{unbalancedNodeData.point}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-900">Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Point Changed:</span>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        unbalancedNodeData.isPointChanged
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {unbalancedNodeData.isPointChanged ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Player Balance */}
      {playerBalance !== null && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader title="Player Balance" />
          <div className="p-6">
            <div className="text-center">
              <p className="mb-2 text-gray-600 text-sm">
                Balance for {playerAddress}
              </p>
              <p className="font-bold text-3xl text-green-600">
                {playerBalance} wei
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataMonitor;
