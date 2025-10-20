import { useMemo, useState } from "react";

interface TournamentFormProps {
  initial?: Partial<{
    id: string;
    name: string;
    type: "Balanced" | "Unbalanced" | string;
    status: "Upcoming" | "Active" | "Ended" | "Settled" | string;
    startDate: string;
    endDate: string;
    prizePool: string;
    prizeTokenAddress?: string;
  }>;
  onSaved?: (id: string) => void;
}

const TournamentForm = ({ initial, onSaved }: TournamentFormProps) => {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "Balanced");
  const [status, setStatus] = useState(initial?.status ?? "Upcoming");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [prizePool, setPrizePool] = useState(initial?.prizePool ?? "");
  const [prizeTokenAddress, setPrizeTokenAddress] = useState(
    initial?.prizeTokenAddress ?? ""
  );
  const [minCoins, setMinCoins] = useState("");
  const [equilibriumMin, setEquilibriumMin] = useState("");
  const [equilibriumMax, setEquilibriumMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = useMemo(
    () => !isEdit || status === "Upcoming",
    [isEdit, status]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        endDate: new Date(endDate),
        equilibriumMax:
          type === "Balanced" && equilibriumMax
            ? Number(equilibriumMax)
            : undefined,
        equilibriumMin:
          type === "Balanced" && equilibriumMin
            ? Number(equilibriumMin)
            : undefined,
        minCoins: minCoins || undefined,
        name,
        prizePool,
        prizeTokenAddress: prizeTokenAddress || undefined,
        startDate: new Date(startDate),
        status,
        type
      };
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const url = isEdit
        ? `${base}/admin/tournaments/${initial?.id}`
        : `${base}/admin/tournaments`;
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const res = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        method: isEdit ? "PUT" : "POST"
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok)
        throw new Error(json?.error || `${res.status} ${res.statusText}`);
      onSaved?.(json.data.id);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Name</span>
          <input
            className="rounded border px-3 py-2"
            disabled={!canEdit || submitting}
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Min Coins</span>
          <input
            className="rounded border px-3 py-2"
            disabled={submitting}
            onChange={(e) => setMinCoins(e.target.value)}
            placeholder="e.g. 10"
            value={minCoins}
          />
        </label>
        {type === "Balanced" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600 text-xs">Equilibrium Min</span>
              <input
                className="rounded border px-3 py-2"
                disabled={submitting}
                onChange={(e) => setEquilibriumMin(e.target.value)}
                placeholder="e.g. 0"
                value={equilibriumMin}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600 text-xs">Equilibrium Max</span>
              <input
                className="rounded border px-3 py-2"
                disabled={submitting}
                onChange={(e) => setEquilibriumMax(e.target.value)}
                placeholder="e.g. 5"
                value={equilibriumMax}
              />
            </label>
          </>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Type</span>
          <select
            className="rounded border px-3 py-2"
            disabled={!canEdit || submitting}
            onChange={(e) => setType(e.target.value)}
            value={type}
          >
            <option>Balanced</option>
            <option>Unbalanced</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Status</span>
          <select
            className="rounded border px-3 py-2"
            disabled={!canEdit || submitting}
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option>Upcoming</option>
            <option>Active</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Start Date</span>
          <input
            className="rounded border px-3 py-2"
            disabled={!canEdit || submitting}
            onChange={(e) => setStartDate(e.target.value)}
            type="datetime-local"
            value={startDate}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">End Date</span>
          <input
            className="rounded border px-3 py-2"
            disabled={!canEdit || submitting}
            onChange={(e) => setEndDate(e.target.value)}
            type="datetime-local"
            value={endDate}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">Prize Pool</span>
          <input
            className="rounded border px-3 py-2"
            disabled={submitting}
            onChange={(e) => setPrizePool(e.target.value)}
            placeholder="e.g. 1000"
            value={prizePool}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600 text-xs">
            Prize Token Address (optional)
          </span>
          <input
            className="rounded border px-3 py-2"
            disabled={submitting}
            onChange={(e) => setPrizeTokenAddress(e.target.value)}
            placeholder="0x..."
            value={prizeTokenAddress}
          />
        </label>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        aria-label={isEdit ? "Update Tournament" : "Create Tournament"}
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        disabled={submitting}
        onClick={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSubmit();
        }}
        tabIndex={0}
        type="button"
      >
        {isEdit
          ? submitting
            ? "Saving…"
            : "Save"
          : submitting
            ? "Creating…"
            : "Create"}
      </button>
    </div>
  );
};

export default TournamentForm;
