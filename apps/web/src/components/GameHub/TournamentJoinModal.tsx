import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import fetchApi from "@/helpers/fetcher";

dayjs.extend(relativeTime);

interface TournamentDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  minCoins?: string | null;
  equilibriumMin?: number | null;
  equilibriumMax?: number | null;
}

interface TournamentJoinModalProps {
  tournamentId: string | null;
  onClose: () => void;
}

const TournamentJoinModal = ({
  tournamentId,
  onClose
}: TournamentJoinModalProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<string>("");
  const [coinsError, setCoinsError] = useState<string>("");
  const [detail, setDetail] = useState<TournamentDetail | null>(null);

  const now = dayjs();
  const canJoin = useMemo(() => {
    if (!detail) return false;
    const nowDt = dayjs();
    const isActive =
      detail.status === "Active" &&
      nowDt.isAfter(dayjs(detail.startDate)) &&
      nowDt.isBefore(dayjs(detail.endDate));
    return isActive;
  }, [detail]);

  useEffect(() => {
    const run = async () => {
      if (!tournamentId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchApi<{ data: TournamentDetail }>(
          `/tournaments/${tournamentId}`,
          { method: "GET" }
        );
        // fetchApi unwraps success/data, but also supports direct shape
        const d: any = res as any;
        setDetail((d?.data ?? d) as TournamentDetail);
      } catch (err: any) {
        setError(err?.message || "Failed to load tournament");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tournamentId]);

  const handleSubmit = async () => {
    if (!detail) return;
    // validate coins
    const minRequired = detail.minCoins ? Number(detail.minCoins) : 0;
    const schema = z
      .number()
      .finite()
      .nonnegative()
      .refine((n) => n > 0, { message: "Amount must be greater than 0" })
      .refine((n) => n >= minRequired, {
        message: `Minimum required is ${minRequired.toLocaleString()}`
      });
    const parsed = Number(coins);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      setCoinsError(result.error.issues[0]?.message || "Invalid amount");
      return;
    }
    setCoinsError("");
    setSubmitting(true);
    setError(null);
    try {
      await fetchApi(`/tournaments/${detail.id}/join`, {
        body: JSON.stringify({ coinsBurned: parsed }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      onClose();
      // Optionally toast success if a toast system exists
    } catch (err: any) {
      setError(err?.message || "Join failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tournamentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        aria-label="Join tournament"
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">
            Join Tournament
          </h3>
          <button
            aria-label="Close"
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : error ? (
          <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{detail.name}</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    detail.type === "Balanced"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {detail.type}
                </span>
              </div>
              <div className="mt-1 text-gray-500 text-sm">
                Status: {detail.status}
              </div>
              <div className="mt-1 text-gray-500 text-xs">
                Starts: {dayjs(detail.startDate).format("YYYY-MM-DD HH:mm")} (
                {dayjs(detail.startDate).from(now)})
              </div>
              <div className="mt-1 text-gray-500 text-xs">
                Ends: {dayjs(detail.endDate).format("YYYY-MM-DD HH:mm")} (
                {dayjs(detail.endDate).from(now)})
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {detail.minCoins && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-gray-500 text-xs">Min Coins</div>
                  <div className="font-medium text-gray-900">
                    {detail.minCoins}
                  </div>
                </div>
              )}
              {detail.equilibriumMin != null && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-gray-500 text-xs">Eq. Min</div>
                  <div className="font-medium text-gray-900">
                    {detail.equilibriumMin}
                  </div>
                </div>
              )}
              {detail.equilibriumMax != null && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-gray-500 text-xs">Eq. Max</div>
                  <div className="font-medium text-gray-900">
                    {detail.equilibriumMax}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                className="mb-1 block text-gray-700 text-sm"
                htmlFor="coinsInput"
              >
                Coins to burn
              </label>
              <input
                aria-label="Coins to burn"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                id="coinsInput"
                inputMode="decimal"
                min="0"
                onChange={(e) => setCoins(e.target.value)}
                placeholder="Enter amount"
                type="number"
                value={coins}
              />
              {coinsError && (
                <div className="mt-1 text-red-600 text-xs">{coinsError}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="rounded-lg px-4 py-2 text-gray-600 text-sm hover:bg-gray-100"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                aria-disabled={!canJoin || submitting}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  canJoin ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400"
                }`}
                disabled={!canJoin || submitting}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? "Joining…" : "Join Tournament"}
              </button>
              {!canJoin && (
                <div className="text-gray-500 text-xs">
                  Joining is only available during active period.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TournamentJoinModal;
