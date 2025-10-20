import { useEffect, useState } from "react";

interface ParticipantDto {
  id: string;
  walletAddress: string;
  coinsBurned: string;
  prizeShareBps?: number | null;
  prizeAmount?: string | null;
}

interface TournamentDto {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  participants: ParticipantDto[];
  settlementTxHash?: string | null;
}

interface Props {
  id: string;
}

const TournamentDetail = ({ id }: Props) => {
  const [data, setData] = useState<TournamentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const res = await fetch(`${base}/admin/tournaments/${id}`);
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok)
        throw new Error(json?.error || `${res.status} ${res.statusText}`);
      setData(json.data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCalculate = async () => {
    setBusy(true);
    try {
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const res = await fetch(`${base}/admin/tournaments/${id}/calc`, {
        method: "POST"
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok)
        throw new Error(json?.error || `${res.status} ${res.statusText}`);
      await load();
    } catch (_err) {
      // noop, error banner below
    } finally {
      setBusy(false);
    }
  };

  const handleSettle = async () => {
    setBusy(true);
    try {
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const res = await fetch(`${base}/admin/tournaments/${id}/settle`, {
        method: "POST"
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok)
        throw new Error(json?.error || `${res.status} ${res.statusText}`);
      await load();
    } catch (_err) {
      // noop
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-4 text-sm">Loading…</div>;
  if (error || !data)
    return (
      <div className="p-4 text-red-500 text-sm">{error || "Not found"}</div>
    );

  const canCalculate = data.status === "Ended";
  const canSettle =
    data.status === "Ended" &&
    data.participants.some((p) => Number(p.prizeAmount || 0) > 0);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{data.name}</h2>
          <div className="text-gray-600 text-xs">
            {data.type} • {data.status}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Calculate Prizes"
            className="rounded bg-indigo-600 px-3 py-1.5 text-white disabled:opacity-50"
            disabled={!canCalculate || busy}
            onClick={handleCalculate}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleCalculate();
            }}
            tabIndex={0}
            type="button"
          >
            Calculate
          </button>
          <button
            aria-label="Send Rewards to Contract"
            className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
            disabled={!canSettle || busy}
            onClick={handleSettle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSettle();
            }}
            tabIndex={0}
            type="button"
          >
            Send Rewards
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Wallet
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Burned
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Share (bps)
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Prize
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.participants.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 text-sm">{p.walletAddress}</td>
                <td className="px-3 py-2 text-sm">{p.coinsBurned}</td>
                <td className="px-3 py-2 text-sm">{p.prizeShareBps ?? 0}</td>
                <td className="px-3 py-2 text-sm">{p.prizeAmount ?? "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.settlementTxHash && (
        <div className="text-gray-600 text-xs">Tx: {data.settlementTxHash}</div>
      )}
    </div>
  );
};

export default TournamentDetail;
