import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { HEY_API_URL } from "@hey/data/constants";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import StatusBanner from "../../Shared/UI/StatusBanner";
import { fetchCategories, type Game } from "../../../helpers/gameHub";
import EditGameModal from "./EditGameModal";

const PAGE_SIZE = 10;

const GameList = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [source, setSource] = useState(params.get("source") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [page, setPage] = useState(Number(params.get("page") || 1));

  const { data: categories } = useQuery({
    queryFn: fetchCategories,
    queryKey: ["game-categories"]
  });

  const { data, isLoading, refetch } = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (category) params.set("category", category);
      if (page) params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(
        `${HEY_API_URL}/games/manage?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to load managed games");
      const json = await res.json();
      const managed = json.games || [];
      const games: Game[] = managed.map((g: any) => ({
        categories: Array.isArray(g.categories)
          ? g.categories.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug
            }))
          : [],
        createdAt: g.createdAt
          ? new Date(g.createdAt).toISOString()
          : new Date().toISOString(),
        description: g.description,
        entryFilePath: g.entryFilePath || "index.html",
        externalUrl: undefined,
        gameFileUrl: g.packageUrl,
        height: g.height,
        id: g.id,
        instructions: g.instructions,
        isFeatured: false,
        likeCount: 0,
        playCount: 0,
        rating: 0,
        ratingCount: 0,
        slug: g.slug,
        source: "Self",
        status: g.status,
        tags: Array.isArray(g.GameTag) ? g.GameTag.map((t: any) => t.name) : [],
        thumb1Url: g.coverImageUrl || g.GameScreenshot?.[0]?.imageUrl || "",
        thumb2Url:
          g.iconUrl || g.coverImageUrl || g.GameScreenshot?.[1]?.imageUrl || "",
        title: g.title,
        updatedAt: g.updatedAt
          ? new Date(g.updatedAt).toISOString()
          : new Date().toISOString(),
        user: undefined,
        userLike: false,
        userRating: undefined,
        width: g.width
      }));
      return {
        games,
        pagination: {
          page: json.pagination?.page || 1,
          total: json.pagination?.total || games.length,
          totalPages: json.pagination?.pages || 1
        }
      };
    },
    queryKey: ["admin-games", { category, page, q, source }]
  });

  const games = data?.games || [];
  const pagination =
    data?.pagination ||
    ({ page: 1, total: games.length, totalPages: 1 } as any);
  const [editing, setEditing] = useState<Game | null>(null);

  const handleDelete = async (game: Game) => {
    const confirmed = confirm(`Delete “${game.title}”?`);
    if (!confirmed) return;
    const res = await fetch(`${HEY_API_URL}/games/manage/${game.id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      alert("Failed to delete game");
      return;
    }
    await refetch();
    const next = new URLSearchParams(params);
    next.set("status", "deleted");
    setParams(next, { replace: true });
  };

  const handleApplyFilters = () => {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    if (source) next.set("source", source);
    else next.delete("source");
    if (category) next.set("category", category);
    else next.delete("category");
    next.set("page", "1");
    setParams(next, { replace: true });
    setPage(1);
  };

  const handlePage = (direction: -1 | 1) => {
    const nextPage = Math.max(
      1,
      Math.min(pagination?.totalPages || 1, page + direction)
    );
    setPage(nextPage);
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <StatusBanner />

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-gray-400" />
              <input
                aria-label="Search games"
                className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title or description"
                value={q}
              />
            </div>
          </div>
          <div>
            <select
              aria-label="Filter by category"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="">All categories</option>
              {categories?.categories?.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              aria-label="Filter by source"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. Self)"
              value={source}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            onClick={() => {
              setQ("");
              setSource("");
              setCategory("");
              handleApplyFilters();
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={handleApplyFilters}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Cover
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Categories
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                URL
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                  colSpan={8}
                >
                  Loading…
                </td>
              </tr>
            ) : (
              games.map((g, idx) => (
                <tr key={g.id}>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {(pagination.page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 text-sm dark:text-gray-200">
                    {g.slug}
                  </td>
                  <td className="px-4 py-3">
                    <img
                      alt={g.title}
                      className="h-12 w-20 rounded object-cover"
                      src={g.thumb1Url || g.thumb2Url}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm dark:text-gray-100">
                    {g.title}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.categories?.map((c) => (
                        <span
                          className="rounded bg-blue-100 px-2 py-0.5 text-blue-800 text-xs dark:bg-blue-900/40 dark:text-blue-200"
                          key={c.id}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-sm dark:text-gray-200">
                    {g.source || "Self"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                        g.status === "Published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <a
                      className="text-blue-600 hover:underline"
                      href={`/gaming-dashboard/game/${g.slug}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      /gamehub/{g.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${g.title}`}
                        className="rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => setEditing(g)}
                        onKeyDown={(e) => e.key === "Enter" && setEditing(g)}
                        tabIndex={0}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${g.title}`}
                        className="rounded p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(g)}
                        onKeyDown={(e) => e.key === "Enter" && handleDelete(g)}
                        tabIndex={0}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
          total)
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
            disabled={pagination.page <= 1}
            onClick={() => handlePage(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePage(1)}
          >
            Next
          </button>
        </div>
      </div>

      <EditGameModal
        categories={categories?.categories || []}
        game={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await refetch();
          const next = new URLSearchParams(params);
          next.set("status", "success");
          next.set("message", "Game updated successfully");
          setParams(next, { replace: true });
        }}
        open={Boolean(editing)}
      />
    </div>
  );
};

export default GameList;
