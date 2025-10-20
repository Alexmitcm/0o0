import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import fetchApi from "@/helpers/fetcher";
import TournamentJoinModal from "./TournamentJoinModal";

interface TournamentItem {
  id: string;
  name: string;
  type: "Balanced" | "Unbalanced" | string;
  status: "Upcoming" | "Active" | "Ended" | "Settled" | string;
  startDate: string;
  endDate: string;
  prizePool: string;
  minCoins?: string | null;
  equilibriumMin?: number | null;
  equilibriumMax?: number | null;
}

// Base URL handled by fetchApi

dayjs.extend(relativeTime);

const fetchTournaments = async (status?: string): Promise<TournamentItem[]> => {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetchApi<{ data: TournamentItem[] }>(
    `/tournaments${search}`,
    {
      headers: { "Content-Type": "application/json" },
      method: "GET"
    } as any
  );
  const d: any = res as any;
  const data = d?.data ?? d;
  return Array.isArray(data) ? data : [];
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-2 flex items-center justify-between">
    <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
  </div>
);

const TournamentCard = ({
  t,
  onJoin
}: {
  t: TournamentItem;
  onJoin: (id: string) => void;
}) => {
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const startsIn = useMemo(() => {
    const s = dayjs(t.startDate);
    if (s.isBefore(dayjs())) return "Started";
    return s.fromNow();
  }, [t.startDate, tick]);

  const endsIn = useMemo(() => {
    const e = dayjs(t.endDate);
    if (e.isBefore(dayjs())) return "Ended";
    return e.fromNow();
  }, [t.endDate, tick]);

  const isUpcoming = t.status === "Upcoming";

  return (
    <fieldset className="flex flex-col justify-between rounded-xl border bg-white p-4 text-left shadow-sm">
      <legend className="sr-only" id={`tournament-title-${t.id}`}>
        {t.name}
      </legend>
      <div>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">{t.name}</div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              t.type === "Balanced"
                ? "bg-blue-100 text-blue-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {t.type}
          </span>
        </div>
        <div className="mt-1 text-gray-500 text-sm">
          Prize Pool: <span className="font-medium">{t.prizePool}</span>
        </div>
        <div className="mt-1 text-gray-500 text-sm">Status: {t.status}</div>
        <div className="mt-1 text-gray-500 text-xs">
          Starts: {dayjs(t.startDate).format("YYYY-MM-DD HH:mm")} ({startsIn})
        </div>
        <div className="mt-1 text-gray-500 text-xs">
          Ends: {dayjs(t.endDate).format("YYYY-MM-DD HH:mm")} ({endsIn})
        </div>
        {isUpcoming && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-gray-700 text-xs">
            Starts in {dayjs(t.startDate).from(dayjs())}
          </div>
        )}
      </div>

      {(t.minCoins || t.equilibriumMin != null || t.equilibriumMax != null) && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {t.minCoins && (
            <div className="rounded bg-gray-50 p-2">
              <div className="text-gray-500">Min Coins</div>
              <div className="font-medium text-gray-900">
                {Number(t.minCoins).toLocaleString()}
              </div>
            </div>
          )}
          {t.equilibriumMin != null && (
            <div className="rounded bg-gray-50 p-2">
              <div className="text-gray-500">Eq. Min</div>
              <div className="font-medium text-gray-900">
                {t.equilibriumMin.toLocaleString()}
              </div>
            </div>
          )}
          {t.equilibriumMax != null && (
            <div className="rounded bg-gray-50 p-2">
              <div className="text-gray-500">Eq. Max</div>
              <div className="font-medium text-gray-900">
                {t.equilibriumMax.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          aria-label={`View details for ${t.name}`}
          className="rounded-md bg-gray-900 px-3 py-1 text-white text-xs hover:bg-black"
          onClick={() => onJoin(t.id)}
          type="button"
        >
          View details
        </button>
      </div>
    </fieldset>
  );
};

const TournamentsSection = () => {
  const [joinId, setJoinId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Upcoming"
  >("All");
  const {
    data: active,
    error: activeError,
    isLoading: activeLoading
  } = useQuery({
    queryFn: () => fetchTournaments("Active"),
    queryKey: ["tournaments", "Active"],
    staleTime: 30_000
  });

  const {
    data: upcoming,
    error: upcomingError,
    isLoading: upcomingLoading
  } = useQuery({
    queryFn: () => fetchTournaments("Upcoming"),
    queryKey: ["tournaments", "Upcoming"],
    staleTime: 30_000
  });

  if (activeLoading && upcomingLoading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        Loading tournaments…
      </div>
    );
  }

  if (activeError && upcomingError) {
    return (
      <div className="rounded-xl border bg-white p-6 text-red-600 shadow-sm">
        Failed to load tournaments
      </div>
    );
  }

  const hasAny = (active?.length ?? 0) + (upcoming?.length ?? 0) > 0;
  if (!hasAny) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">Tournaments</div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="tourn-status">
            Status filter
          </label>
          <select
            aria-label="Status filter"
            className="rounded-md border px-2 py-1 text-sm"
            id="tourn-status"
            onChange={(e) => setStatusFilter(e.target.value as any)}
            value={statusFilter}
          >
            <option>All</option>
            <option>Active</option>
            <option>Upcoming</option>
          </select>
        </div>
      </div>
      {statusFilter !== "Upcoming" && active && active.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <SectionHeader title="Active Tournaments" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((t) => (
              <TournamentCard key={t.id} onJoin={(id) => setJoinId(id)} t={t} />
            ))}
          </div>
        </div>
      )}

      {statusFilter !== "Active" && upcoming && upcoming.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <SectionHeader title="Upcoming Tournaments" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => (
              <TournamentCard key={t.id} onJoin={(id) => setJoinId(id)} t={t} />
            ))}
          </div>
        </div>
      )}
      {joinId && (
        <TournamentJoinModal
          onClose={() => setJoinId(null)}
          tournamentId={joinId}
        />
      )}
    </div>
  );
};

export default TournamentsSection;
