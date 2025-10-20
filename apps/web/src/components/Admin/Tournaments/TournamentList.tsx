import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface TournamentDto {
  id: string;
  name: string;
  type: "Balanced" | "Unbalanced" | string;
  status: "Upcoming" | "Active" | "Ended" | "Settled" | string;
  startDate: string;
  endDate: string;
  prizePool: string;
}

const fetchTournaments = async (): Promise<TournamentDto[]> => {
  const base = (import.meta as any).env?.VITE_API_URL || "";
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const res = await fetch(`${base}/admin/tournaments`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error("Failed to load tournaments");
  const json = await res.json();
  return json.data ?? [];
};

const TournamentList = () => {
  const {
    data = [],
    isLoading,
    error
  } = useQuery({
    queryFn: fetchTournaments,
    queryKey: ["admin", "tournaments"]
  });

  const rows = useMemo(() => data, [data]);

  if (isLoading) return <div className="p-4 text-sm">Loading tournaments…</div>;
  if (error)
    return (
      <div className="p-4 text-red-500 text-sm">Failed to load tournaments</div>
    );

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Tournaments</h2>
        <a
          aria-label="Create Tournament"
          className="rounded bg-indigo-600 px-3 py-1.5 text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          href="#/admin/tournaments/new"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              window.location.href = "#/admin/tournaments/new";
            }
          }}
          tabIndex={0}
        >
          New
        </a>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Start
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                End
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2 text-sm">{t.name}</td>
                <td className="px-3 py-2 text-sm">{t.type}</td>
                <td className="px-3 py-2 text-sm">{t.status}</td>
                <td className="px-3 py-2 text-sm">
                  {new Date(t.startDate).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-sm">
                  {new Date(t.endDate).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <a
                    aria-label={`View ${t.name}`}
                    className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    href={`#/admin/tournaments/${t.id}`}
                    onKeyDown={(evt) => {
                      if (evt.key === "Enter" || evt.key === " ") {
                        window.location.href = `#/admin/tournaments/${t.id}`;
                      }
                    }}
                    tabIndex={0}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TournamentList;
